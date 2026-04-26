---
published: true
type: 'qna'
level: 'junior'
title: "SQL JOIN의 종류와 차이를 설명해 주세요"
date: '2026-04-27'
categories: ['Database', 'SQL']
---

## 핵심 요약

- **INNER JOIN**: 양쪽 모두에 매칭되는 행만.
- **LEFT/RIGHT OUTER JOIN**: 한쪽 전부 + 매칭되는 반대쪽. 매칭 없으면 NULL.
- **FULL OUTER JOIN**: 양쪽 전부.
- **CROSS JOIN**: 카티시안 곱(모든 조합).
- **SELF JOIN**: 같은 테이블끼리.

면접에서 자주 따라오는 질문은 "INNER와 LEFT 결과 차이", "JOIN 시 ON과 WHERE의 차이", "JOIN 성능 영향"입니다.

## ON vs WHERE

```sql
-- 다른 결과 가능
SELECT * FROM a LEFT JOIN b ON a.id = b.a_id AND b.status = 'X';
SELECT * FROM a LEFT JOIN b ON a.id = b.a_id WHERE b.status = 'X';
```

- `ON`의 조건은 **JOIN 시점**에 평가 → 매칭 안 되면 b쪽이 NULL인 행이 남음.
- `WHERE`의 조건은 **JOIN 후** 필터 → b가 NULL인 행은 `b.status = 'X'`가 false라 제거됨 → INNER JOIN과 같은 효과.

이 차이는 LEFT JOIN과 결합 시 함정의 단골 출처.

## INNER vs LEFT JOIN 결정

- "주문이 있는 고객만" → INNER.
- "모든 고객 + 주문 정보(없으면 NULL)" → LEFT.
- "주문 안 한 고객만" → LEFT JOIN + `WHERE b.id IS NULL` (anti-join).

## 카티시안 곱 주의

```sql
SELECT * FROM a, b; -- 또는 CROSS JOIN
```

10만 행 × 10만 행 = 100억 행. 의도치 않은 카티시안 곱은 디스크/메모리 폭발의 흔한 사고.

## JOIN 알고리즘

DB가 내부적으로 사용:

- **Nested Loop Join**: 한쪽을 돌며 다른쪽 조회. **인덱스가 있을 때 효율**. 작은 결과 집합에 강함.
- **Hash Join**: 해시 테이블 빌드 후 다른 테이블 probe. 큰 테이블 + 동등 비교에 강함.
- **Sort-Merge Join**: 양쪽 정렬 후 병합. 이미 정렬된 인덱스가 있으면 효율.

옵티마이저가 통계로 선택. EXPLAIN으로 확인 가능.

## JOIN과 인덱스

- JOIN 컬럼에 인덱스 → Nested Loop의 inner 측이 빨라짐.
- 외래키에 자동 인덱스가 안 생기는 DB(PostgreSQL)는 직접 추가.
- 복합 키 JOIN은 컬럼 순서 일치 필요.

## SELF JOIN

같은 테이블을 두 별칭으로 조인. 예: 직원 테이블에서 매니저 정보.

```sql
SELECT e.name, m.name AS manager
FROM employee e
LEFT JOIN employee m ON e.manager_id = m.id;
```

## EXISTS vs IN vs JOIN

- `IN (subquery)`: 작은 결과면 효율.
- `EXISTS (subquery)`: 존재 여부만 → 보통 효율 좋음.
- `JOIN + DISTINCT`: 중복 제거 비용. EXISTS로 대체 권장.

옵티마이저가 셋을 동등하게 변환하는 경우도 많지만 의도가 명확하게 드러나는 표현 선택.

## 자주 헷갈리는 디테일

- LEFT JOIN 후 `COUNT(*)`와 `COUNT(b.id)` 다름. 후자는 NULL을 안 셈.
- USING(column) vs ON: 같은 이름 컬럼이면 USING이 짧지만 결과 컬럼 처리 주의.
- NATURAL JOIN은 동일 이름 컬럼 자동 조인 — 스키마 변경에 깨지기 쉬워 비추천.

## 면접 follow-up

- "INNER JOIN과 LEFT JOIN + IS NOT NULL 차이?" → 옵티마이저는 보통 같게 평가. 의도 표현은 INNER가 명확.
- "JOIN이 N+1처럼 느려지면?" → 누락 인덱스, 통계 부정확, 결과 집합이 너무 커서 Nested Loop가 비효율인 경우. EXPLAIN으로 분석.
- "한 테이블에 자기 참조 트리 구조 쿼리?" → 재귀 CTE(`WITH RECURSIVE`).
