---
published: true
type: 'qna'
level: 'junior'
title: "equals와 hashCode를 같이 오버라이드해야 하는 이유는?"
date: '2026-04-27'
categories: ['Java', 'CS']
---

## Q1. 왜 equals와 hashCode를 같이 오버라이드해야 하나요?

**A.** **HashMap/HashSet이 hashCode로 버킷을 찾고 equals로 동등성을 검사**하기 때문입니다. 둘이 어긋나면 컬렉션이 깨집니다.

```java
record User(Long id, String name) {}

Set<User> set = new HashSet<>();
set.add(new User(1L, "kim"));
set.contains(new User(1L, "kim")); // record는 true, 직접 클래스에 미오버라이드면 false
```

equals만 오버라이드하고 hashCode를 안 하면 같은 값을 다른 버킷에서 찾게 되어 `contains`가 false를 반환합니다.

---

## Q2. equals/hashCode 계약은 무엇인가요?

**A.** `Object` 클래스가 정의한 약속이 있습니다.

1. `a.equals(b)` = true면 **반드시** `a.hashCode() == b.hashCode()`.
2. hashCode가 같다고 equals가 true일 필요는 없음(충돌 가능).
3. equals는 **반사성, 대칭성, 추이성, 일관성**을 만족.

오버라이드하지 않으면 기본 구현은 **참조 동등성**(같은 객체 여부)이라 값이 같아도 다른 객체면 다르다고 판단합니다.

---

## Q3. 좋은 hashCode는 어떻게 만드나요?

**A.** **모든 equals 비교 필드를 사용**하고 `Objects.hash(...)`로 합치는 게 가장 단순합니다.

```java
@Override public int hashCode() { return Objects.hash(id, email); }
```

충돌이 너무 많으면 HashMap 성능이 O(n)으로 저하되지만, Java 8+는 충돌 시 트리(red-black)로 자동 변환해 O(log n)을 보장합니다. 그래도 좋은 분포가 항상 우선입니다.

`31` 같은 소수가 곱셈에 자주 쓰이는 이유는 비트 분산 + JVM이 `31 * x`를 `(x << 5) - x`로 최적화할 수 있기 때문입니다.

---

## Q4. 어떤 필드를 equals 비교에 써야 하나요?

**A.** **불변 식별자**가 안전합니다.

- ID 같은 불변 키는 컬렉션에 들어간 후에도 안정.
- 가변 필드를 쓰면 객체가 컬렉션에 들어간 후 필드를 바꾸면 다시 찾지 못합니다.
- 비즈니스 키(이메일, 주문번호)도 사용 가능하지만 키 변경 정책이 명확해야 합니다.

핵심: **HashMap의 키는 불변이 안전**.

---

## Q5. JPA Entity에서 equals/hashCode는 어떻게 짜야 하나요?

**A.** 가장 까다로운 케이스입니다.

- **ID 기반**: 영속화 전 ID가 null이라 두 비영속 엔티티가 모두 같다고 판단되는 문제. null 체크 필수.
- **모든 필드 기반**: 지연 로딩 컬렉션 접근 시 `LazyInitializationException` + 성능 폭발.

권장: **ID 기반 + null 체크** 또는 **비즈니스 키 기반**. Lombok `@Data`는 모든 필드를 비교하므로 JPA Entity에는 비추천입니다.

---

## Q6. record와 Lombok 중 무엇을 쓰시나요?

**A.** 데이터 클래스 성격에 따라 다릅니다.

- **`record`**(Java 14+): 불변 데이터에 최적. equals/hashCode/toString 자동 생성. 깔끔함이 최고 장점.
- **Lombok `@EqualsAndHashCode`**: 가변 객체 또는 record 못 쓰는 환경. **`onlyExplicitlyIncluded = true`** + `@EqualsAndHashCode.Include`로 사용 필드 명시 권장.
- **`@Data`**: 모든 필드 자동. JPA Entity에는 위험.

---

## Q7. == 와 equals는 어떻게 다른가요?

**A.** `==`는 **참조 비교**, `equals`는 **동등성 비교**입니다.

흔한 함정:
- `Integer a = 127, b = 127; a == b` → **true** (Integer 캐시 -128~127).
- `Integer a = 128, b = 128; a == b` → **false**.
- `String a = "x", b = "x"; a == b` → **true** (String pool).
- `String a = new String("x"), b = "x"; a == b` → **false**.

객체 비교는 항상 `equals`로 하는 게 안전합니다.

---

## Q8. HashMap의 키로 쓴 객체의 필드를 변경하면 어떻게 되나요?

**A.** **그 키로 다시 못 찾습니다**.

새 hashCode가 다른 버킷을 가리키므로 `get`이 null을 반환합니다. 이 함정 때문에 **HashMap 키는 불변 객체**가 강력히 권장됩니다.

같은 이유로 equals/hashCode 비교에 가변 필드를 쓰지 말고, 부득이하다면 컬렉션에 넣은 후 필드 변경을 하지 않는 컨벤션이 필요합니다.
