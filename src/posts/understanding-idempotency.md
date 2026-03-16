---
title: "MSA 환경에서 데이터 정합성을 지키는 카드: 멱등성(Idempotency)과 이벤트 중복 처리"
date: "2026-03-16"
description: "커머스 MSA 프로젝트의 결제 로직을 구현하며 마주한 메시지 중복 이슈와, 이를 해결하기 위한 멱등성 보장 전략에 대한 기록입니다."
tags: ["Kafka", "Backend", "Event-Driven"]
---

최근 커머스 MSA(Microservices Architecture) 프로젝트를 진행하며 결제와 주문 서비스 간의 데이터 정합성을 맞추는 작업을 했습니다. 단순히 서비스를 분리하는 것보다 훨씬 까다로웠던 점은, 네트워크 장애나 서비스 재시작 등으로 인해 발생할 수 있는 '메시지 중복 처리'를 어떻게 방어하느냐였습니다.

특히 Saga 패턴을 적용하며 Kafka를 통해 결제 완료 이벤트를 주고받는 과정에서, 같은 이벤트가 두 번 이상 소비(Consume)될 경우 이미 완료된 결제가 또 처리되거나 중복된 결과가 발생할 위험이 있다는 것을 깨달았습니다. 이를 해결하기 위해 필수적으로 적용해야 했던 개념이 바로 **멱등성(Idempotency)**이었습니다.

## MSA와 메시지 중복의 필연성

분산 환경에서 메시지 브로커(Kafka 등)는 보통 '최소 한 번 전송(At-least-once delivery)' 방식을 사용합니다. 이는 메시지가 유실되지 않도록 보장하지만, 반대로 네트워크 지연 등의 이유로 동일한 메시지가 중복으로 전달될 수 있다는 뜻이기도 합니다.

만약 결제 서비스에서 `order-created` 이벤트를 중복으로 받는다면 어떻게 될까요?
- 이미 결제 데이터를 생성했는데, 또 결제 요청이 들어와 데이터가 중복 생성될 수 있습니다.
- 이는 곧 유저에게 중복 과금이 발생하거나 시스템 데이터의 불일치로 이어집니다.

이런 상황에서도 **연산을 여러 번 적용하더라도 결과가 달라지지 않는 성질**인 멱등성을 보장해야만 시스템의 안정성을 확보할 수 있습니다.

## 해결책: 이력 관리를 통한 멱등성 보장 (Idempotent Consumer)

이번 프로젝트에서 채택한 방식은 **처리된 이벤트 ID를 DB에 기록하여 중복을 원천 차단**하는 'Idempotent Consumer' 패턴이었습니다. 

논리적인 흐름은 다음과 같습니다.

![MSA Kafka Idempotency Flow](/public/images/msa_kafka_idempotency_flow.png)

1. 이벤트를 수신하면 해당 이벤트에 포함된 고유한 `eventId`를 확인합니다.
2. `processed_events`라는 별도의 테이블(또는 캐시)에서 해당 ID가 이미 존재하는지 체크합니다.
3. 만약 이미 존재한다면 '이미 처리된 이벤트'로 판단하고 로직을 수행하지 않은 채 건너뜁니다.
4. 처음 보는 ID라면 비즈니스 로직(결제 처리 등)을 수행하고, 완료 후 `eventId`를 테이블에 저장합니다.

## 코드로 구현해본 멱등성 방어 로직

프로젝트의 `payment-service`에서 실제로 사용한 로직을 바탕으로, 이벤트 기반의 멱등성 처리 과정을 시뮬레이션해 보았습니다.

```typescript
// test/idempotency.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

// MSA 환경에서의 이벤트 기반 멱등성 처리 시뮬레이션
class EventConsumer {
  // 실제 프로젝트에서는 데이터베이스의 'processed_events' 테이블 역할을 함
  private processedEvents = new Set<string>(); 

  async handleEvent(event: { eventId: string; type: string; data: any }) {
    // 1. 중복성 체크 (isDuplicate)
    if (this.processedEvents.has(event.eventId)) {
      console.warn(`[중복 이벤트 무시] eventId: ${event.eventId}`);
      return { success: true, duplicated: true };
    }

    // 2. 비즈니스 로직 수행 (예: 결제 정보 생성 및 상태 변경)
    // 실제로는 Service 레이어의 로직이 여기서 호출됨
    console.log(`[이벤트 처리 중] type: ${event.type}, data:`, event.data);
    
    // 3. 처리된 이벤트 ID 기록 (markProcessed)
    // 트랜잭션 내에서 비즈니스 로직과 함께 저장되어야 원자성을 보장할 수 있음
    this.processedEvents.add(event.eventId);
    
    return { success: true, duplicated: false };
  }
}

describe('MSA Event Idempotency (Idempotent Consumer Pattern)', () => {
  let consumer: EventConsumer;

  beforeEach(() => {
    consumer = new EventConsumer();
  });

  it('동일한 Event ID가 들어오면 두 번째부터는 무시해야 한다', async () => {
    const event = {
      eventId: 'evt_saga_payment_001',
      type: 'order-created',
      data: { orderId: 101, amount: 50000 }
    };

    // 첫 번째 처리: 성공
    const firstResult = await consumer.handleEvent(event);
    expect(firstResult.duplicated).toBe(false);

    // 동일한 이벤트 재입입 (Kafka 등의 Retry 상황 가정): 무시
    const secondResult = await consumer.handleEvent(event);
    expect(secondResult.duplicated).toBe(true);
  });
});
```

위 로직의 핵심은 비즈니스 로직의 수행과 이벤트 ID 기록이 한 트랜잭션 내에서 이루어져야 한다는 점입니다. 그래야만 로직은 성공했는데 ID 기록이 실패하여 다시 중복 처리가 발생하는 상황을 막을 수 있습니다.

## 마무리하며

단순히 결제 기능을 만드는 것과, "어떤 상황에서도 결제가 단 한 번만 일어남을 보장하는 것"은 전혀 다른 수준의 고민이라는 것을 깨달았습니다. 이번 MSA 프로젝트의 결제 모듈을 구현하며 아키텍처적으로 데이터 정합성을 지키기 위한 이중, 삼중의 방어 체계가 왜 필요한지 몸소 느낄 수 있었습니다.

처음에는 무작정 결제 버튼을 막는 식의 프론트엔드 처리에만 급급했었지만, 이제는 백엔드와 인프라 레이어에서부터 멱등성을 설계해야 진정으로 신뢰할 수 있는 시스템이 된다는 점을 배웠습니다. 분산 시스템이 주는 복잡함은 두렵지만, 그 문제를 하나씩 해결해가며 얻는 견고한 데이터 정합성의 가치는 무엇보다 크다는 것을 다시금 확인한 경험이었습니다.
