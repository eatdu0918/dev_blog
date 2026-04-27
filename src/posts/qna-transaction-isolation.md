---
published: true
type: 'qna'
level: 'mid'
title: "트랜잭션 격리 수준(Isolation Level)을 어떤 기준으로 선택하시나요?"
date: '2026-04-26'
categories: ['Database', 'Backend', 'Concurrency']
---

## Q1. 트랜잭션 격리 수준 4단계와 각 이상 현상을 정리해 주세요.

**A.**

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|:---:|:---:|:---:|
| READ UNCOMMITTED | O | O | O |
| READ COMMITTED | X | O | O |
| REPEATABLE READ | X | X | O (MySQL은 X) |
| SERIALIZABLE | X | X | X |

격리 수준은 **동시성 이상 현상과 성능의 트레이드오프**입니다. 표만 외우지 말고 각 현상이 실무에서 어떻게 보이는지 설명할 수 있어야 합니다.

---

## Q2. Dirty Read와 Non-repeatable Read, Phantom Read를 시나리오로 설명해 주세요.

**A.**

- **Dirty Read**: A가 잔액을 100→200으로 바꾸고 **커밋 전**에 B가 200을 읽음. A가 롤백하면 B는 존재한 적 없는 값을 본 것.
- **Non-repeatable Read**: B가 같은 행을 두 번 읽는 사이 A가 UPDATE+커밋. B의 두 SELECT 결과가 다름.
- **Phantom Read**: B가 `WHERE age > 30`을 두 번 읽는 사이 A가 **새 행을 INSERT**+커밋. 행의 **집합**이 달라짐.

Phantom과 Non-repeatable의 차이: **같은 행이 바뀌면 NR, 행 집합이 바뀌면 Phantom**.

---

## Q3. DB별 기본 격리 수준은?

**A.**
- **PostgreSQL/Oracle**: READ COMMITTED.
- **MySQL(InnoDB)**: REPEATABLE READ + **갭 락**으로 phantom까지 거의 차단.
- **SQL Server**: READ COMMITTED + snapshot 옵션.

MySQL RR은 표준보다 강하지만 **갭 락으로 인한 데드락**이 자주 발생합니다. INSERT가 많은 워크로드에서는 의도적으로 RC로 낮추는 사례도 흔합니다(카카오/네이버 사례).

---

## Q4. MVCC는 격리를 어떻게 구현하나요?

**A.** **Multi-Version Concurrency Control**: UPDATE 시 새 버전을 만들고, 각 트랜잭션은 자기 시작 시점 기준의 **스냅샷**을 봅니다.

장점:
- 읽기는 락을 안 잡고 과거 버전을 봄.
- "읽기는 쓰기를 막지 않고, 쓰기는 읽기를 막지 않음".

비용:
- 옛 버전(undo/이전 row) 누적 → **vacuum/purge 부담**.
- **장기 트랜잭션이 스냅샷을 오래 잡으면** 버전 폭증 + 성능 저하.

---

## Q5. Lost Update는 격리 수준으로 막을 수 있나요?

**A.** **표준 격리 수준으로는 완전히 막히지 않습니다**. 별도 처리가 필요.

```
A: x = SELECT balance (100 읽음)
B: x = SELECT balance (100 읽음)
A: UPDATE balance = 100 - 50 (50)
B: UPDATE balance = 100 - 30 (70)  ← A의 변경 사라짐
```

해결:
- **`SELECT FOR UPDATE`**(비관적 락): 읽는 시점에 락.
- **버전 컬럼**(낙관적 락): UPDATE 시 `WHERE version = ?` 조건.
- **CAS**: 조건부 UPDATE.

격리 수준만 올리는 건 답이 아닙니다.

---

## Q6. SERIALIZABLE은 어떻게 구현되나요?

**A.** 두 가지 방식이 있습니다.

- **2PL(엄격한 락)**: 모든 읽기/쓰기에 락. 직렬화 가능. 락 경합 큼.
- **SSI(Serializable Snapshot Isolation)** — PostgreSQL: 스냅샷 위에 충돌 추적. 충돌 시 한 쪽 abort.

"SERIALIZABLE 쓰면 안전"이 아니라 **직렬화 실패 시 재시도 로직 필수**입니다. 애플리케이션이 transaction retry를 명시적으로 처리해야 합니다.

---

## Q7. 어떤 기준으로 격리 수준을 선택하시나요?

**A.** **기본은 RC/RR, 정확성이 중요한 곳에만 강화**입니다.

- **단순 조회/관리 페이지**: RC로 충분.
- **잔액/재고 차감**: 격리 수준이 아니라 **`SELECT FOR UPDATE` 또는 버전 컬럼**.
- **분산 환경**: DB 격리만으로 부족 → 분산 락, saga, outbox.

격리 수준은 **읽기 일관성** 위주. 쓰기 충돌은 락이나 버전이 따로 책임집니다.

---

## Q8. 장기 트랜잭션이 왜 위험한가요?

**A.** **스냅샷 유지 비용** 때문입니다.

- 옛 버전이 vacuum 안 되어 디스크 누적.
- replication lag 증가(레플리카가 옛 버전을 따라잡아야 함).
- DB 통계가 부정확해질 위험.

PostgreSQL은 `pg_stat_activity`로 장기 트랜잭션 모니터링이 필수. 5분 이상 열려 있으면 알람을 거는 게 일반적입니다.

---

## Q9. 낙관적 락과 비관적 락 중 무엇을 선택하시나요?

**A.** **충돌 빈도**로 결정합니다.

- **충돌 잦음** → 비관적 락. 락 대기 비용 < 재시도 비용.
- **충돌 드묾** → 낙관적 락. 락 안 잡고 빠르게 진행, 충돌 시 재시도.

선착순 쿠폰 같이 충돌이 거의 100%인 경우 낙관적 락은 재시도 폭주로 망가지므로 비관적 락 또는 큐 기반 직렬화가 답입니다.

---

## Q10. MVCC에서 UPDATE는 락을 안 잡나요?

**A.** **잡습니다**. 같은 행 UPDATE는 row 락이 걸립니다.

MVCC는 **읽기-쓰기**가 안 부딪히게 만드는 메커니즘이지, **쓰기-쓰기**까지 막아주는 건 아닙니다.

- 두 트랜잭션이 같은 행 UPDATE → 한 쪽이 락 대기.
- 다른 행 UPDATE → 동시 진행 가능.

읽기는 스냅샷에서 옛 버전을 보므로 락을 안 잡지만, 쓰기는 동기화가 필요해 락이 잡힙니다.
