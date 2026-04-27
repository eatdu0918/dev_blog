---
published: true
type: 'qna'
level: 'junior'
title: "SQL JOIN의 종류와 차이를 설명해 주세요"
date: '2026-04-27'
categories: ['Database', 'SQL']
---

## Q1. JOIN 종류를 한 줄씩 설명해 주세요.

**A.**
- **INNER JOIN**: 양쪽 모두에 매칭되는 행만.
- **LEFT/RIGHT OUTER JOIN**: 한쪽 전부 + 매칭되는 반대쪽. 매칭 없으면 NULL.
- **FULL OUTER JOIN**: 양쪽 전부.
- **CROSS JOIN**: 카티시안 곱(모든 조합).
- **SELF JOIN**: 같은 테이블끼리.

선택 기준은 **"왼쪽/오른쪽 테이블의 모든 행이 결과에 필요한가?"**입니다.

---

## Q2. ON과 WHERE는 어떻게 다른가요?

**A.** **JOIN 시점이냐 그 후냐**의 차이고, LEFT JOIN과 결합 시 결과가 달라집니다.

```sql
-- (1) ON에 조건
SELECT * FROM a LEFT JOIN b ON a.id = b.a_id AND b.status = 'X';

-- (2) WHERE에 조건
SELECT * FROM a LEFT JOIN b ON a.id = b.a_id WHERE b.status = 'X';
```

- (1): a의 모든 행이 남고, 매칭 안 되면 b는 NULL.
- (2): WHERE가 JOIN 후 필터 → b가 NULL인 행은 `b.status = 'X'`가 false라 제거 → INNER JOIN과 같은 효과.

LEFT JOIN의 의미를 살리려면 b의 조건은 **ON에 같이** 둬야 합니다.

---

## Q3. INNER JOIN과 LEFT JOIN은 어떻게 결정하시나요?

**A.** 결과 집합에 어떤 행을 포함할지로 결정.

- "주문이 있는 고객만" → INNER.
- "모든 고객 + 주문 정보(없으면 NULL)" → LEFT.
- "주문 안 한 고객만" → LEFT JOIN + `WHERE b.id IS NULL` (anti-join).

anti-join 패턴은 자주 쓰이지만 EXISTS 서브쿼리가 더 명확한 경우도 있습니다.

---

## Q4. 카티시안 곱은 어떨 때 발생하나요?

**A.** **JOIN 조건을 빠뜨릴 때**입니다.

```sql
SELECT * FROM a, b;  -- 또는 CROSS JOIN
```

10만 × 10만 = 100억 행 → 디스크/메모리 폭발. 콤마 JOIN을 실수로 사용하거나 ON 조건을 빠뜨리면 사고가 납니다. 명시적 INNER JOIN + ON을 쓰는 컨벤션이 안전합니다.

---

## Q5. DB는 JOIN을 내부적으로 어떻게 처리하나요?

**A.** 옵티마이저가 통계로 3가지 알고리즘 중 선택합니다.

- **Nested Loop Join**: 한쪽을 돌며 다른쪽 조회. **인덱스 있을 때 효율**. 작은 결과 집합에 강함.
- **Hash Join**: 해시 테이블 빌드 후 다른 테이블 probe. 큰 테이블 + 동등 비교에 강함.
- **Sort-Merge Join**: 양쪽 정렬 후 병합. 이미 정렬된 인덱스가 있으면 효율.

EXPLAIN으로 어떤 방식이 선택됐는지 확인할 수 있습니다.

---

## Q6. JOIN 성능 최적화의 핵심은?

**A.** **JOIN 컬럼에 인덱스**입니다.

- Nested Loop의 inner 측 인덱스가 가장 큰 영향.
- PostgreSQL은 외래키에 자동 인덱스를 안 만들어주므로 **직접 추가**해야 함.
- 복합 키 JOIN은 컬럼 순서 일치 필요.

JOIN이 느리면 1순위는 누락된 인덱스, 2순위는 옵티마이저 통계 부정확, 3순위는 결과 집합이 너무 커서 Nested Loop가 비효율인 경우입니다.

---

## Q7. EXISTS, IN, JOIN 중 무엇을 쓰시나요?

**A.** 의도에 따라 다릅니다.

- **`IN (subquery)`**: 작은 결과면 효율. 가독성 좋음.
- **`EXISTS (subquery)`**: 존재 여부만 검사. 보통 효율 좋고 의도가 명확.
- **`JOIN + DISTINCT`**: 중복 제거 비용. EXISTS로 대체 권장.

옵티마이저가 셋을 동등하게 변환하는 경우도 많지만, **의도가 명확하게 드러나는 표현**을 선택하는 게 유지보수에 좋습니다.

---

## Q8. LEFT JOIN 후 COUNT(*)와 COUNT(b.id)가 다른 이유는?

**A.** **NULL 처리 방식**이 다릅니다.

- `COUNT(*)`: 모든 행을 셈. NULL 행도 포함.
- `COUNT(b.id)`: b.id가 NULL이 아닌 행만 셈.

```sql
SELECT a.id, COUNT(*), COUNT(b.id)
FROM a LEFT JOIN b ON a.id = b.a_id
GROUP BY a.id;
```

매칭되는 b가 없는 a는 `COUNT(*)`는 1, `COUNT(b.id)`는 0. 의도에 따라 명확히 선택해야 합니다.

---

## Q9. SELF JOIN은 어떨 때 쓰나요?

**A.** **같은 테이블 안에서 행 간 관계**를 표현할 때.

```sql
-- 직원 + 매니저 정보
SELECT e.name AS employee, m.name AS manager
FROM employee e
LEFT JOIN employee m ON e.manager_id = m.id;
```

계층 구조가 깊어지면 **재귀 CTE**(`WITH RECURSIVE`)로 모든 상위/하위를 한 번에 조회합니다.

---

## Q10. JOIN이 N+1처럼 느려지면 어떻게 진단하시나요?

**A.** EXPLAIN으로 단계별 확인:

1. **인덱스 사용 여부**: `key` 컬럼이 NULL이면 누락.
2. **rows 추정치**: 실제와 큰 차이면 `ANALYZE` 또는 통계 갱신.
3. **알고리즘**: 작은 결과 집합인데 Hash Join이면 옵티마이저 오판단 가능.
4. **데이터 타입 불일치**: VARCHAR vs INT 비교는 인덱스 무력화.

대부분 인덱스 누락이거나 통계 부정확이고, 그 다음이 쿼리 재작성이 필요한 경우입니다.
