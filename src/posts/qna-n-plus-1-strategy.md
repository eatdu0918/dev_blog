---
published: true
type: 'qna'
level: 'mid'
title: "N+1 문제는 왜 생기고, 어떤 기준으로 해결 전략을 선택하시나요?"
date: '2026-04-26'
categories: ['JPA', 'Performance', 'Backend']
---

## 핵심 요약

N+1은 "1번의 컬렉션 조회 + N번의 연관 로딩"으로 쿼리가 폭증하는 현상입니다. 해법은 **fetch join, EntityGraph, BatchSize, DTO projection** 네 가지인데 단순히 "fetch join이 정답"이라고 답하면 깊이가 부족하다고 보입니다. 트레이드오프를 들어 어떤 상황에 무엇을 쓰는지 답해야 합니다.

## 어떤 기준으로 고르는가

각 전략에는 명확한 약점이 있습니다.

- **Fetch Join**: ToOne 연관에는 거의 모든 경우 1순위. 하지만 ToMany 연관에 적용하면 카르테시안 곱이 발생해 페이지네이션과 함께 쓸 수 없습니다(`firstResult/maxResults specified with collection fetch; applying in memory!` 경고). 페이지네이션이 필요하면 절대 첫 선택이 될 수 없습니다.
- **EntityGraph**: 코드는 깔끔하지만 결국 fetch join과 같은 SQL이 생성됩니다. JPQL을 손대고 싶지 않을 때, 또는 쿼리 메서드 이름은 유지하면서 fetch만 바꾸고 싶을 때 적합합니다.
- **@BatchSize / hibernate.default_batch_fetch_size**: ToMany 페이지네이션의 정공법입니다. `IN (?, ?, ?, ...)`로 묶어 N+1을 N/batch+1로 줄이며, 페이지네이션을 깨뜨리지 않습니다. 글로벌 설정으로 100~1000을 두는 편이 무난합니다.
- **DTO projection**: 화면 전용 조회처럼 엔티티 그래프 전체가 필요 없을 때, 정확히 필요한 컬럼만 SELECT 절에 박는 게 가장 빠릅니다. 영속성 컨텍스트에 올라가지 않으니 메모리도 절약됩니다.

## 실제 의사결정 흐름

저는 보통 이렇게 분기합니다.

1. **목록 + 상세 화면용 조회인가?** 그렇다면 일단 DTO projection을 1순위로 둡니다. 조회 전용이면 엔티티가 필요 없습니다.
2. **엔티티 단위로 다뤄야 한다면 ToOne만 묶이는가?** 그러면 fetch join 또는 EntityGraph가 적절합니다.
3. **ToMany이고 페이지네이션이 필요한가?** 그러면 BatchSize 한 가지 선택지로 좁아집니다.
4. **여러 ToMany를 동시에 끌어와야 한다면?** 두 컬렉션을 동시에 fetch join하면 `MultipleBagFetchException`이 납니다. Set으로 바꾸거나, 한 개만 fetch join하고 나머지는 BatchSize로 풀어냅니다.

## 자주 같이 묻는 함정

- **OSIV가 켜진 채 운영**이면 컨트롤러/뷰에서 엉뚱하게 lazy 로딩이 일어나 디버깅이 어려워집니다. `spring.jpa.open-in-view=false`로 끄고, 서비스 계층에서 필요한 것을 모두 끌어오는 습관이 좋습니다.
- **`@OneToMany(fetch = EAGER)`는 N+1의 영구 유발기**라 실무에서는 거의 LAZY로 통일합니다.
- **Soft delete 칼럼**과 fetch join을 함께 쓸 때 `@Where`/`@SQLRestriction`이 모든 경로에 적용되는지 확인해야 합니다.

## 면접 follow-up

- "EXPLAIN으로 실제 쿼리를 본 적 있나요?" → 인덱스 미스, full scan, 카르테시안 곱 사례를 한두 개 준비해두면 좋습니다.
- "조회 성능을 더 짜내야 한다면?" → 읽기 전용 트랜잭션(`@Transactional(readOnly=true)`)으로 dirty checking 비용 제거, 2차 캐시 검토, CQRS로 read model 분리 같은 단계로 깊이 있는 답변이 가능합니다.
