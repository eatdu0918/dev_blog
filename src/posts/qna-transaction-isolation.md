---
published: true
type: 'qna'
level: 'mid'
title: "트랜잭션 격리 수준(Isolation Level)을 어떤 기준으로 선택하시나요?"
date: '2026-04-26'
categories: ['Database', 'Backend', 'Concurrency']
---

## 핵심 요약

격리 수준은 **동시성 이상 현상**과 **성능** 사이의 트레이드오프입니다.

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|:---:|:---:|:---:|
| READ UNCOMMITTED | O | O | O |
| READ COMMITTED | X | O | O |
| REPEATABLE READ | X | X | O (MySQL은 X) |
| SERIALIZABLE | X | X | X |

이 표만 외우면 면접에서 한 단계 더 들어가는 질문에 막힙니다. **각 이상 현상이 실무에서 어떻게 보이는지**, **MVCC가 격리를 어떻게 구현하는지**가 핵심입니다.

## 이상 현상을 시나리오로

- **Dirty Read**: 트랜잭션 A가 잔액을 100→200으로 바꾸고 아직 커밋 안 했는데 B가 200을 읽음. A가 롤백하면 B는 존재한 적 없는 값을 본 것.
- **Non-repeatable Read**: B가 같은 행을 두 번 읽는 사이 A가 UPDATE+커밋. B의 두 SELECT 결과가 다름.
- **Phantom Read**: B가 `WHERE age > 30`을 두 번 읽는 사이 A가 새 행을 INSERT+커밋. **행의 집합이 달라짐**(기존 행 변경이 아니라).

Lost Update(두 트랜잭션이 같은 값을 읽고 각자 갱신)는 표준 격리로 완전히 막히지 않아서 **별도 처리**(SELECT FOR UPDATE, 낙관적 락, 버전 컬럼)가 필요합니다.

## DB별 기본값과 함정

- **PostgreSQL/Oracle**: 기본 READ COMMITTED.
- **MySQL(InnoDB)**: 기본 REPEATABLE READ + **갭 락(Gap Lock)** 으로 phantom까지 거의 차단. 그래서 MySQL의 RR은 표준보다 강함.
- **SQL Server**: READ COMMITTED + snapshot 옵션.

MySQL RR은 **갭 락으로 인한 데드락**이 자주 일어나는 함정. INSERT가 많은 워크로드에서 RC로 낮추는 곳도 많습니다(특히 카카오/네이버 사례 자주 인용).

## MVCC가 어떻게 격리를 만드나

**Multi-Version Concurrency Control**: UPDATE 시 새 버전을 만들고, 각 트랜잭션은 자기 시작 시점 기준의 **스냅샷**을 봅니다.

- 읽기는 락을 안 잡고 과거 버전을 보므로 "읽기는 쓰기를 막지 않고, 쓰기는 읽기를 막지 않음".
- 비용: 옛 버전(undo/이전 row) 누적 → vacuum/purge 부담.
- 장기 트랜잭션은 스냅샷을 오래 잡고 있어서 **버전 폭증 + 성능 저하**의 원인. 모니터링 필수.

## SERIALIZABLE의 두 종류

- **2PL(엄격한 락)**: 직렬화 가능하지만 락 경합 큼.
- **SSI(Serializable Snapshot Isolation)** — PostgreSQL: 스냅샷 위에 충돌 추적. 충돌 시 한 쪽이 abort 되어 재시도 필요.

"SERIALIZABLE 쓰면 안전"이라기보다 "**직렬화 실패 → 재시도 로직**이 필수"라는 점이 실무 포인트.

## 어떻게 선택하나

기본은 RC 또는 RR로 두고, **돈/재고처럼 정확성이 중요한 곳에만 명시적으로 강화**합니다.

- 단순 조회/관리 페이지: RC로 충분.
- 잔액/재고 차감: SELECT FOR UPDATE(비관적 락) 또는 버전 컬럼(낙관적 락). 격리 수준만 올리는 건 정답이 아님.
- 분산 환경: DB 격리만으로 부족 → 분산 락(Redis), saga, outbox 패턴까지.

## 자주 헷갈리는 디테일

- **Phantom과 Non-repeatable의 차이**: 같은 행이 바뀌면 NR, 행 집합이 바뀌면 Phantom.
- "REPEATABLE READ면 Lost Update 막아주나?" → 표준상 막아주지 않음. MySQL은 갭 락 덕에 일부 케이스 차단.
- 격리 수준은 **읽기 일관성** 위주. 쓰기 충돌은 락/버전 칼럼이 따로 책임.

## 면접 follow-up

- "MVCC에서 UPDATE는 락이 없나?" → 같은 행 UPDATE는 row 락이 잡힙니다. 읽기 vs 쓰기만 안 부딪힐 뿐.
- "장기 트랜잭션이 왜 위험한가?" → 스냅샷 유지로 옛 버전이 안 지워지고 vacuum/replication lag 발생.
- "낙관 vs 비관 락 선택 기준?" → 충돌 빈도. 잦으면 비관, 드물면 낙관(재시도 비용 < 락 대기 비용).
