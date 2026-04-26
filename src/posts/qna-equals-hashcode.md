---
published: true
type: 'qna'
level: 'junior'
title: "equals와 hashCode를 같이 오버라이드해야 하는 이유는?"
date: '2026-04-27'
categories: ['Java', 'CS']
---

## 핵심 요약

Java 면접의 단골. 답은 한 줄로: **HashMap/HashSet이 hashCode로 버킷을 찾고 equals로 동등성 검사**하기 때문에 둘이 어긋나면 컬렉션이 깨집니다.

## equals/hashCode 계약

`Object` 클래스가 정의한 약속:

1. `a.equals(b)`가 true면 `a.hashCode() == b.hashCode()`여야 함.
2. `a.hashCode() == b.hashCode()`라고 `a.equals(b)`가 true일 필요는 없음(충돌 가능).
3. equals는 **반사성, 대칭성, 추이성, 일관성**을 만족해야 함.

오버라이드하지 않으면 기본 구현은 **참조 동등성**(같은 객체 여부) — 값이 같아도 다른 객체면 다르다고 판단.

## 깨졌을 때 무슨 일이?

```java
record User(Long id, String name) {} // record는 자동 생성

Set<User> set = new HashSet<>();
set.add(new User(1L, "kim"));
set.contains(new User(1L, "kim")); // ?
```

equals/hashCode가 자동 생성된 `record`나 Lombok `@EqualsAndHashCode`라면 true. 둘 다 안 하면 false.

equals만 오버라이드하고 hashCode를 안 하면:
- `set.add(u)` 후 `set.contains(u)`가 false일 수 있음(다른 버킷 검색).
- HashMap key로 못 씀.

## 좋은 hashCode 만들기

- 모든 equals 비교 필드를 사용.
- `Objects.hash(field1, field2, ...)` 권장.
- 충돌이 너무 많으면 HashMap 성능 저하 → Java 8+는 충돌 시 트리화.

## 어떤 필드를 비교에 쓸까

- **불변 식별자**(id 등) 권장. 가변 필드 사용 시 컬렉션에 들어간 후 필드 변경되면 못 찾음.
- 비즈니스 키(이메일, 주문번호) 사용 시 키 변경 정책 명확.

## JPA Entity의 함정

`@Entity` 클래스의 equals/hashCode는 까다롭습니다.

- ID 기반: 영속화 전엔 ID가 null → 두 비영속 엔티티가 모두 같다고 판단되는 문제.
- 모든 필드 기반: 지연 로딩 컬렉션 접근 시 LazyInitializationException + 성능 폭발.
- 권장: ID 기반 + null 체크. 또는 비즈니스 키.

## record와 Lombok

- `record`(Java 14+): equals/hashCode/toString 자동 생성. 불변 데이터 클래스에 최적.
- Lombok `@EqualsAndHashCode`: 사용 필드 명시 권장(`onlyExplicitlyIncluded = true`).
- `@Data`: equals/hashCode/toString 모두. **JPA Entity에는 비추천**.

## 자주 헷갈리는 디테일

- `==`는 참조 비교, `equals`는 동등성. 박싱된 Integer를 `==`로 비교하면 캐시(-128~127) 범위에 따라 결과가 달라짐.
- `String.equals`는 내용 비교. 인턴 풀(`String.intern()`)과는 별개.
- HashMap의 키 객체 필드를 변경하면 **그 키로 다시 못 찾음**. 키는 불변이 안전.

## 면접 follow-up

- "hashCode가 무조건 같아야 하는 이유?" → 다른 버킷에 들어가면 HashSet/Map이 못 찾음.
- "equals가 추이성을 깨는 예?" → 부모-자식 관계에서 잘못 짠 equals. `instanceof`보다 `getClass()` 비교가 안전한 경우.
- "왜 hashCode를 곱셈/덧셈으로 합치나?" → 비트 분산 + 충돌 감소. 31은 소수 + JVM 곱셈 최적화로 전통적 선택.
