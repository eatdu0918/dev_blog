---
published: true
type: 'qna'
level: 'mid'
title: "Kafka에서 at-least-once / at-most-once / exactly-once의 차이를 설명하고, 실무에서 어떻게 보장하시나요?"
date: '2026-04-26'
categories: ['Kafka', 'MSA', 'Distributed System']
---

## Q1. at-most-once / at-least-once / exactly-once의 차이는 뭔가요?

**A.**
- **at-most-once**: 중복 없음, 유실 가능.
- **at-least-once**: 유실 없음, 중복 가능. **현업의 디폴트**.
- **exactly-once**: 중복도 유실도 없음. Kafka가 일부 시나리오에서 보장하지만 **end-to-end exactly-once는 환상에 가깝습니다**.

실무에서는 "**at-least-once + 컨슈머 멱등 처리**"로 사실상의 once를 만드는 게 정공법입니다.

---

## Q2. 메시지 유실은 어디서 발생하나요?

**A.** 세 지점이 있습니다.

1. **Producer → Broker**: `acks` 설정과 retry 정책.
2. **Broker 내부**: 복제와 디스크 fsync.
3. **Broker → Consumer**: commit 시점.

이 중 가장 자주 사고가 나는 곳은 **컨슈머 측 commit 시점**입니다.

---

## Q3. Producer 설정은 어떻게 하시나요?

**A.** 운영 기본 권장:

- **`acks=all`**: 모든 ISR이 복제하면 ack. 유실 거의 없음.
- **`min.insync.replicas=2`**: 최소 2개 ISR 필요(ISR 1개로 떨어지면 producer 거부).
- **`enable.idempotence=true`**: 같은 메시지 재전송 시 브로커가 중복 제거. Producer 측 중복 방지.
- **`retries=Integer.MAX_VALUE`** + 명확한 `delivery.timeout.ms`.

`acks=0`은 응답 안 기다려 가장 빠르지만 유실 가능. 거의 안 씁니다.

---

## Q4. Consumer 측 commit 전략은 어떻게 가져가시나요?

**A.** **`enable.auto.commit=false` + 처리 후 명시적 commit**이 운영 기본입니다.

- **처리 전 commit** → 처리 실패 시 유실(at-most-once).
- **처리 후 commit** → commit 직전 죽으면 다음에 다시 받음(at-least-once).
- Auto-commit은 처리 시점과 무관하게 백그라운드 commit되어 사고 분석이 어려움.

at-least-once를 받아들이고 **컨슈머 측 멱등 처리**로 중복을 흡수하는 게 가장 안정적입니다.

---

## Q5. 컨슈머 멱등 처리는 어떻게 구현하나요?

**A.** 3가지 방식이 자주 쓰입니다.

1. **메시지 ID 기반 중복 처리 테이블**: `processed_messages(id PK)`에 INSERT, 중복이면 무시. 비즈니스 로직과 같은 트랜잭션.
2. **자연 멱등성**: 상태 머신 전이라면 이미 처리된 row UPDATE에 조건 추가 → NOOP.
3. **upsert**: `INSERT ... ON CONFLICT DO NOTHING`.

이 처리가 없으면 어떤 Kafka 설정을 해도 중복을 막을 수 없습니다.

---

## Q6. Kafka의 exactly-once 모드는 진짜 exactly-once인가요?

**A.** **Kafka 내부의 read-process-write가 atomic**이라는 의미입니다. 외부 DB/API와 묶인 흐름까지는 보장 못합니다.

end-to-end exactly-once를 흉내내려면:
- **아웃바운드**: Outbox 패턴 + 컨슈머 측 멱등성.
- **처리**: 메시지 ID 단위 중복 검출.
- **인바운드**: idempotency key.

이 조합이면 "사실상 한 번"이 됩니다. 수학적 once는 분산 시스템에서 불가능에 가깝다는 인정이 출발점입니다.

---

## Q7. 메시지 순서는 어떻게 보장하나요?

**A.** **같은 키의 메시지는 같은 파티션으로** 가서 순서가 보장됩니다.

```
producer.send(new ProducerRecord("topic", userId, message));
```

같은 `userId`의 메시지는 모두 같은 파티션 → FIFO. 다른 키 간에는 순서 무관.

순서가 중요한 도메인(주문 상태 변화, 사용자별 이벤트)이면 **키 설계가 핵심**입니다. 키가 잘못되면 어떤 컨슈머 로직으로도 순서를 복구할 수 없습니다.

---

## Q8. 파티션과 컨슈머의 관계는?

**A.** 컨슈머 그룹 안에서 **파티션 1개당 컨슈머 1개**가 매핑됩니다.

- 파티션 8개 + 컨슈머 4개 → 각 컨슈머가 2 파티션.
- 파티션 8개 + 컨슈머 16개 → 8개만 활성, 8개는 대기.
- 컨슈머를 늘려도 **파티션 수를 넘을 수 없음**.

처리량이 부족하면 파티션 수를 늘려야 컨슈머도 늘릴 수 있습니다. 다만 파티션 추가는 키 분포를 깰 수 있어 신중히.

---

## Q9. Rebalance가 자주 일어나면 어떻게 진단하나요?

**A.** 컨슈머의 **처리 시간**과 **타임아웃 설정**을 같이 봅니다.

- `session.timeout.ms` 안에 heartbeat 못 보내면 죽은 것으로 판정.
- `max.poll.interval.ms` 안에 다음 poll 못 하면 컨슈머 그룹에서 제외.
- 처리 시간이 길어지면 둘 다 위험.

해결:
- **`max.poll.records`** 줄여 한 번에 처리할 메시지 수 감소.
- **Cooperative rebalance**(2.4+): 영향 범위가 좁아 전체 멈춤 회피.
- 처리 시간 단축 또는 비동기 처리 패턴.

---

## Q10. Lag 모니터링은 어떻게 하시나요?

**A.** **Burrow**나 **Kafka Exporter + Prometheus**가 표준입니다.

체크 포인트:
- Lag이 단조 증가 → 컨슈머 처리량 부족.
- Lag spike → rebalance 또는 외부 의존(DB 등) 지연.
- 파티션별 lag 편차가 크면 키 분포 불균형.

Lag은 시스템의 건강을 보여주는 가장 직접적인 지표라 알림과 대시보드의 1순위입니다.
