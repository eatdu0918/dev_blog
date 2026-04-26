---
published: true
type: 'qna'
level: 'mid'
title: "Kafka에서 at-least-once / at-most-once / exactly-once의 차이를 설명하고, 실무에서 어떻게 보장하시나요?"
date: '2026-04-26'
categories: ['Kafka', 'MSA', 'Distributed System']
---

## 핵심 요약

- **at-most-once**: 중복은 없지만 유실 가능.
- **at-least-once**: 유실 없지만 중복 가능. **현업의 디폴트**.
- **exactly-once**: 중복도 유실도 없음. Kafka가 트랜잭션으로 일부 시나리오에서 보장하지만, **end-to-end exactly-once는 환상에 가깝습니다**.

실무에서는 "at-least-once + 컨슈머 멱등 처리"로 사실상의 once를 만드는 게 정공법입니다.

## 어디서 중복/유실이 발생하는가

세 지점이 있습니다.

### 1. Producer → Broker
- `acks=0`: 응답 안 기다림. 가장 빠르지만 유실 가능. 거의 안 씀.
- `acks=1`: 리더만 받으면 ack. 리더가 ack 직후 죽으면 유실 가능.
- `acks=all` + `min.insync.replicas=2`: ISR 모두 복제 후 ack. 유실 거의 없음. **운영 기본값으로 권장**.
- 추가로 `enable.idempotence=true`: 같은 메시지를 재전송해도 브로커가 중복 제거. Producer 측 중복 방지.

### 2. Broker 내부
- 복제 + 디스크 fsync 정책에 좌우. `unclean.leader.election.enable=false`로 데이터 손실 가능한 리더 승격 차단.

### 3. Broker → Consumer
- 가장 자주 사고가 나는 지점.
- 메시지를 처리하기 **전**에 commit하면 → 처리 실패 시 유실(at-most-once).
- 처리 **후** commit하면 → 처리 후 commit 직전에 죽으면 다음에 같은 메시지를 다시 받음(at-least-once).
- Auto-commit이 켜져 있으면 처리 시점과 무관하게 백그라운드로 commit되어 사고 분석이 어려워짐. **`enable.auto.commit=false` + 명시적 commit**이 운영 기본.

## 실무 권장 조합

저는 보통 다음 조합으로 시작합니다.

- Producer: `acks=all`, `enable.idempotence=true`, `retries=Integer.MAX_VALUE`, `delivery.timeout.ms` 명확히.
- Broker: `min.insync.replicas=2`, replication factor 3.
- Consumer: `enable.auto.commit=false`, 처리 후 명시적 commit, **컨슈머 측 멱등 처리** 필수.

## 컨슈머 멱등 처리의 정공법

같은 메시지가 2번 와도 같은 결과가 되어야 합니다.

- **메시지 ID 기반 중복 처리 테이블**: `processed_messages(id PRIMARY KEY)`에 INSERT, 중복이면 무시. 비즈니스 로직과 같은 트랜잭션에 묶음.
- **자연 멱등성**: 상태 머신 전이라면 같은 상태로의 전이는 무시. UPDATE문에 조건을 넣어 이미 처리된 row는 NOOP.
- **upsert 활용**: PRIMARY KEY 충돌 시 ON CONFLICT.

이 처리가 없으면 어떤 Kafka 설정을 해도 중복은 막을 수 없습니다.

## "Exactly-once" 신화

Kafka 0.11부터 트랜잭션 API와 `processing.guarantee=exactly_once`를 지원합니다. 하지만 이는 **Kafka 내부에서의 read-process-write가 atomic**이라는 의미일 뿐, 외부 DB나 외부 API와 묶인 흐름까지 exactly-once를 보장하진 않습니다.

end-to-end exactly-once를 흉내내려면:
- 아웃바운드: **Outbox 패턴** + 컨슈머 측 멱등성.
- 처리: 메시지 ID 단위 중복 검출.
- 인바운드: idempotency key.

이 조합이면 사실상 한 번만 처리된 것과 동일한 효과를 얻습니다. "가능한 한 강하게 보장"이지 "수학적으로 한 번"은 아닙니다.

## 자주 묻는 디테일

- **메시지 순서**: 같은 키의 메시지는 같은 파티션으로 가니 순서 보장. 다른 키는 순서 무관. 순서가 중요하면 키 설계가 핵심.
- **파티션과 컨슈머의 관계**: 컨슈머 그룹 내에서 파티션 1개당 컨슈머 1개. 컨슈머를 늘려도 파티션 수보다 많아질 수 없음.
- **DLQ(Dead Letter Queue)**: 처리 실패 메시지를 별도 토픽으로. 무한 재시도 루프 방지.
- **Backpressure**: `max.poll.records`, `max.poll.interval.ms` 튜닝으로 처리 시간 통제. 길어지면 rebalance 폭발.

## 면접 follow-up

- "Rebalance가 자주 일어난다면?" → `session.timeout`, `max.poll.interval`, 처리 시간을 같이 봅니다. Cooperative rebalance로 영향 범위 축소.
- "Outbox와 Kafka transaction을 같이 써야 하나요?" → 보통 Outbox만으로 충분. Kafka transaction은 stream 처리 내부 atomicity가 필요할 때.
- "Lag 모니터링은 어떻게?" → Burrow, Kafka Exporter + Prometheus. Lag이 단조 증가하면 컨슈머 쪽 병목 신호.
