---
published: true
type: 'qna'
level: 'senior'
title: "여러 서비스에 걸친 트랜잭션 일관성을 어떻게 보장하시겠어요? 2PC, Saga, Outbox 중 무엇을 선택하시나요?"
date: '2026-04-26'
categories: ['MSA', 'Architecture', 'Distributed System']
---

## 핵심 요약

분산 환경에서 ACID는 비싸고, 보통 BASE(Eventual Consistency)로 타협합니다. 실무 기준 우선순위는 **Outbox + Saga 조합**이 압도적이고, 2PC는 거의 선택지에 두지 않습니다.

## 왜 2PC를 거의 안 쓰는가

XA/2PC는 한때 정공법이었지만 마이크로서비스에는 잘 맞지 않습니다.

- **Coordinator가 SPOF**가 됩니다. 코디네이터가 죽으면 참여자는 in-doubt 상태로 락을 잡고 기다립니다.
- **블로킹 프로토콜**이라 prepare~commit 사이 락 점유 시간이 길어 처리량이 급감합니다.
- 쿠버네티스 / 컨테이너 기반에서는 노드 셧다운이 흔해 in-doubt 트랜잭션 복구가 운영 부담입니다.
- Kafka, S3, 외부 SaaS API 등 **트랜잭션을 지원하지 않는 리소스**가 거의 항상 끼기 때문에 결국 별도의 보상 로직이 필요해집니다.

결과적으로 Saga가 사실상 표준입니다.

## Saga와 Outbox는 경쟁 관계가 아니다

자주 헷갈리는 부분인데, 둘은 다른 층위의 문제를 풉니다.

- **Saga**: 비즈니스 로직 차원의 흐름 제어 — 여러 단계 트랜잭션이 실패했을 때 보상 트랜잭션(compensating transaction)으로 되돌리는 패턴.
- **Outbox**: 인프라 차원의 신뢰성 — "DB 커밋과 메시지 발행을 하나의 원자적 동작처럼" 보장하는 패턴.

즉, Outbox는 Saga의 한 스텝이 메시지를 안전하게 보내기 위해 쓰는 도구입니다.

## Saga: Choreography vs Orchestration

- **Choreography**: 각 서비스가 이벤트를 듣고 반응. 단순한 흐름에 좋고, 결합도가 낮음. 단계가 많아지면 흐름 추적이 어렵습니다.
- **Orchestration**: 중앙 오케스트레이터가 상태 머신처럼 흐름을 지휘. 가시성과 디버깅에 유리. 단일 지점이 생기는 단점.

저는 **3단계 이내면 Choreography, 4단계 이상이거나 보상 흐름이 복잡하면 Orchestration**으로 가는 편입니다.

## Outbox: CDC vs Polling

Outbox 구현은 두 갈래입니다.

- **CDC (Debezium 등)**: 운영 부담이 있지만 지연이 작고 표준적. 성숙한 인프라가 있을 때 권장.
- **Polling**: 별도 인프라 없이 스케줄러로 outbox 테이블을 긁어 발행. 단순하지만 지연 시간(polling interval)이 트레이드오프.

스타트업이나 인프라가 가벼운 환경이면 polling으로 시작해도 충분히 견고하게 만들 수 있습니다. 중복 발행은 피할 수 없으니 컨슈머는 **반드시 멱등(idempotent) 처리**가 되어야 합니다.

## 실제 의사결정 예시

"주문 → 결제 → 재고 차감" 흐름이라면 저는 다음과 같이 짭니다.

1. 주문 서비스: 주문 생성과 outbox row 삽입을 같은 트랜잭션으로 커밋.
2. Outbox publisher가 `OrderCreated` 메시지를 Kafka로 발행.
3. 결제 서비스가 메시지를 소비, 결제 처리 후 자체 outbox로 `PaymentApproved` 발행.
4. 재고 서비스가 차감, 실패 시 `StockReservationFailed` 이벤트로 결제 환불 보상 트랜잭션 트리거.
5. 모든 컨슈머는 메시지 ID 기준 멱등성 보장.

## 면접 follow-up

- "메시지 중복은 어떻게 막나요?" → 컨슈머 측 멱등 키 테이블, exactly-once는 환상에 가깝다는 인정.
- "보상 불가능한 작업(이메일 발송 등)은?" → "최후에 배치"하거나, draft 상태로 만들어 confirm 단계에서만 진짜 발송되도록 설계.
- "타임아웃은 어떻게 잡나요?" → SLA 기반 + 추적 가능한 saga 상태 테이블로 관리.
