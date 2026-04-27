---
published: true
type: 'qna'
level: 'mid'
title: "N+1 문제는 왜 생기고, 어떤 기준으로 해결 전략을 선택하시나요?"
date: '2026-04-26'
categories: ['JPA', 'Performance', 'Backend']
---

## Q1. N+1 문제가 무엇인가요?

**A.** "**1번의 컬렉션 조회 + N번의 연관 로딩**"으로 쿼리가 폭증하는 현상입니다.

```java
List<Order> orders = orderRepository.findAll(); // 1번
for (Order o : orders) {
    o.getMember().getName(); // N번 (각 주문마다)
}
```

총 N+1번의 쿼리가 발생합니다. 100개 주문이면 101개 쿼리 → DB 라운드트립 폭발.

---

## Q2. 해결 전략에는 어떤 것들이 있나요?

**A.** 4가지가 핵심입니다.

- **Fetch Join**: JPQL에 `JOIN FETCH`로 한 번에.
- **EntityGraph**: 어노테이션으로 fetch 그래프 명시.
- **@BatchSize / `default_batch_fetch_size`**: `IN(?, ?, ...)` 로 묶어 batch 로딩.
- **DTO projection**: 필요한 컬럼만 SELECT.

"무조건 fetch join"이 아니라 **상황별 선택**이 핵심입니다.

---

## Q3. Fetch Join은 언제 쓰면 안 되나요?

**A.** **ToMany 연관 + 페이지네이션** 조합에서 쓰면 안 됩니다.

ToMany를 fetch join하면 카르테시안 곱으로 결과가 부풀어 페이지 크기가 의도와 달라집니다. Hibernate는 경고를 띄우고 **모든 데이터를 메모리에서 페이지네이션** 합니다 → 메모리 폭발.

```
firstResult/maxResults specified with collection fetch; applying in memory!
```

ToOne 연관에는 거의 모든 경우 1순위로 적합하지만, ToMany + 페이지네이션은 BatchSize로 가야 합니다.

---

## Q4. @BatchSize는 어떻게 동작하나요?

**A.** Lazy 로딩 시점에 **묶어서 IN 쿼리**로 가져옵니다.

```java
@BatchSize(size = 100)
@OneToMany(...)
private List<Item> items;
```

- 100개 부모 엔티티에 대해 자식 컬렉션 접근 시 `WHERE parent_id IN (?, ?, ..., ?)` 한 번에 가져옴.
- N+1 → N/batch+1로 감소.
- **페이지네이션을 깨뜨리지 않음**.

글로벌 설정 `hibernate.default_batch_fetch_size=100~1000`이 무난합니다.

---

## Q5. DTO projection은 언제 가장 효과적인가요?

**A.** **조회 전용 화면**(엔티티 단위 작업이 필요 없는 경우)에 가장 빠릅니다.

```java
@Query("SELECT new com.dto.OrderDto(o.id, o.amount, m.name) FROM Order o JOIN o.member m")
List<OrderDto> findAllAsDto();
```

장점:
- 정확히 필요한 컬럼만 SELECT.
- 영속성 컨텍스트에 올라가지 않아 메모리 절약.
- dirty checking 비용 0.

목록 + 상세 화면이면 DTO projection을 1순위로 두는 게 보통 가장 빠릅니다.

---

## Q6. 여러 ToMany를 동시에 fetch join하면 어떻게 되나요?

**A.** **`MultipleBagFetchException`** 이 발생합니다. Hibernate가 카르테시안 곱이 너무 커지는 것을 막기 위함입니다.

해결:
- 하나만 fetch join하고 나머지는 **`@BatchSize`** 로 풀기.
- `List` 대신 **`Set`** 으로 바꾸기(중복 제거 효과 + 예외 회피).
- DTO projection으로 두 번 나눠 조회 후 조합.

---

## Q7. OSIV가 켜져 있으면 어떤 문제가 생기나요?

**A.** **컨트롤러/뷰에서 엉뚱한 위치에 lazy 로딩이 일어나** 디버깅이 어려워집니다.

OSIV(Open Session in View)가 켜지면 영속성 컨텍스트가 view 렌더링까지 살아있어, 의도치 않은 곳에서 쿼리가 발생합니다.

권장: **`spring.jpa.open-in-view=false`** 로 끄고, 서비스 계층에서 필요한 데이터를 모두 끌어오는 습관을 만듭니다. N+1을 추적하기도 쉬워집니다.

---

## Q8. 결정 흐름을 정리해 주세요.

**A.** 4단계 분기입니다.

1. **목록/상세 화면 조회인가?** → DTO projection 1순위.
2. **엔티티 단위로 다뤄야 + ToOne만 묶이는가?** → Fetch Join 또는 EntityGraph.
3. **ToMany + 페이지네이션 필요?** → BatchSize.
4. **여러 ToMany 동시?** → 하나만 fetch join + 나머지 BatchSize, Set 활용.

---

## Q9. N+1을 더 짜내려면 어떤 옵션이 있나요?

**A.** 추가로 4가지를 검토합니다.

- **`@Transactional(readOnly = true)`**: dirty checking 비용 제거, flush 모드 MANUAL.
- **2차 캐시(Hibernate L2 cache)**: 자주 안 변하는 참조 엔티티에 한해.
- **CQRS**: 읽기 모델을 별도 테이블/뷰로 분리해 JPA에서 빼냄.
- **MyBatis/JOOQ로 조회 전용 코드 분리**: 복잡 조회는 JPA보다 SQL 직접 작성이 빠를 때가 많음.

조회 성능이 핵심인 도메인이라면 ORM 안에서만 해결하려 하지 말고 영역 분리를 고려합니다.
