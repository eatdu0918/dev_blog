---
title: "Outbox 패턴의 완성: 실패한 이벤트의 재시도와 생명주기 관리"
date: "2026-03-16"
description: "Transactional Outbox 패턴 도입 후, 실제 운영 환경에서 직면한 이벤트 발송 실패 대응과 데이터 정리 전략에 대한 회고입니다."
tags: ["Architecture", "Kafka", "Design Pattern"]
---

이전에 Transactional Outbox 패턴을 도입하여 DB 커밋과 이벤트 발행 사이의 정합성 문제를 해결했지만, 실제 운영 환경에서는 또 다른 숙제가 남아있었습니다. "Kafka 브로커가 잠시 중단되거나 네트워크 순단이 발생했을 때, Outbox 테이블에 쌓인 실패한 메시지들을 어떻게 다시 안전하게 보낼 것인가?" 그리고 "성공적으로 처리된 데이터들은 언제까지 보관해야 하는가?"에 대한 고민이었습니다.

이번 프로젝트의 `OutboxProcessor`를 구현하며 적용한 안정적인 이벤트 배달 보장 체계와 운영 전략을 정리해 보았습니다.

## 이벤트 발송도 끈기 있게: 재시도(Retry) 메커니즘

단순히 한 번 발송을 시도하고 끝내는 것이 아니라, 실패한 이벤트를 추적하고 다시 시도하는 과정이 필요했습니다.

![Outbox Retry System Flow](/public/images/outbox_retry_system_flow.png)

1. **상태 기반 추적**: `OutboxEvent` 엔티티에 `status(PENDING, PROCESSED, FAILED)`와 `retryCount` 필드를 두었습니다.
2. **백그라운드 재시도**: `retryFailedEvents` 스케줄러를 통해 상태가 `FAILED`인 이벤트를 주기적으로 다시 대기열(`PENDING`)로 복귀시킵니다.
3. **최대 재시도 횟수 제한**: 무한 루프를 방지하기 위해 `MAX_RETRY_COUNT`를 설정하여, 특정 횟수 이상 실패한 이벤트는 더 이상 자동 재시도하지 않고 알람을 통해 수동 조치하도록 설계했습니다.

## 데이터 다이어트: 자동 정리(Cleanup) 전략

Outbox 테이블은 이벤트가 발행될 때마다 레코드가 추가되므로, 관리를 하지 않으면 금방 비대해져 DB 성능에 영향을 주게 됩니다.

- **성공 데이터 삭제**: 이미 발송 완료된(`PROCESSED`) 데이터를 영구히 보관할 필요는 없습니다. 
- **보존 기간 설정**: `cleanupProcessedEvents` 스케줄러를 활용해 `CLEANUP_DAYS(예: 7일)`가 지난 성공 데이터들을 매일 새벽 자동으로 삭제하여 테이블 크기를 일정하게 유지했습니다.

## 코드로 살펴보는 Processor 로직

실제 프로젝트에서 사용한 `OutboxProcessor`의 주요 로직을 간소화하여 재현해 보았습니다.

```typescript
// MSA 환경의 Outbox 재시도 및 정리 로직 시뮬레이션
class OutboxProcessor {
  private outboxTable: any[] = [];
  private readonly MAX_RETRY = 3;

  // 1. 미발행 이벤트 처리 (1초마다 실행 가정)
  async processPendingEvents() {
    const pendingEvents = this.outboxTable.filter(e => e.status === 'PENDING');
    
    for (const event of pendingEvents) {
      try {
        await this.sendToKafka(event);
        event.status = 'PROCESSED';
        event.processedAt = new Date();
      } catch (error) {
        event.status = 'FAILED';
        event.retryCount++;
        console.error(`발송 실패: ${event.id}, 시도 횟수: ${event.retryCount}`);
      }
    }
  }

  // 2. 실패한 이벤트 재시도 대기열 추가 (1분마다 실행 가정)
  retryFailedEvents() {
    this.outboxTable
      .filter(e => e.status === 'FAILED' && e.retryCount < this.MAX_RETRY)
      .forEach(e => {
        e.status = 'PENDING';
        console.log(`재시도 대기열 추가: ${e.id}`);
      });
  }

  private async sendToKafka(event: any) {
    // Kafka 발행 로직 (네트워크 장애 가정)
    if (Math.random() < 0.2) throw new Error("Kafka Down");
    return true;
  }
}
```

## 마치며

패턴을 하나 도입하는 것은 시작일 뿐, 실제 운영에서 발생하는 '예외의 예외'까지 고민해야 비로소 견고한 시스템이 된다는 것을 배웠습니다. 특히 `retryCount`를 통해 무분별한 재시도를 막고, `cleanup` 로직으로 인프라의 부담을 줄이는 과정은 기능 구현만큼이나 중요한 소프트웨어 엔지니어링의 한 축임을 다시금 실감했습니다.
