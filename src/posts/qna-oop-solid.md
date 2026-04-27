---
published: true
type: 'qna'
level: 'junior'
title: "객체지향의 4대 특징과 SOLID 원칙을 설명해 주세요"
date: '2026-04-27'
categories: ['CS', 'OOP', 'Design']
---

## Q1. 객체지향의 4대 특징을 설명해 주세요.

**A.**

- **추상화(Abstraction)**: 복잡한 시스템에서 본질만 드러내고 나머지는 숨김. 인터페이스/추상 클래스로 표현.
- **캡슐화(Encapsulation)**: 상태를 내부로 숨기고 동작으로만 접근. **잘못된 상태로 가는 경로를 차단**하는 것이 본질.
- **상속(Inheritance)**: 공통 행동을 부모로 묶음. 단, **구현 상속은 결합을 강화**하므로 현대 권장은 합성 선호.
- **다형성(Polymorphism)**: 같은 메시지에 객체마다 다른 응답. **확장에 열려 있고 변경에 닫혀 있는** 설계의 토대.

---

## Q2. 캡슐화는 단순히 private 키워드를 말하는 건가요?

**A.** **아닙니다**. 무엇을 노출할지의 **설계 결정**이 본질입니다.

getter/setter를 모든 필드에 만드는 건 캡슐화가 아니라 **상태를 그냥 노출하는 것**과 같습니다. 진짜 캡슐화는:

- 외부에서 호출할 의미 있는 동작만 메서드로 노출.
- 잘못된 상태로 가는 경로를 차단(검증 + 도메인 메서드).
- 내부 데이터 구조 변경이 외부 코드에 영향 없도록.

`account.balance += amount` 대신 `account.deposit(amount)`가 캡슐화입니다.

---

## Q3. SRP(단일 책임 원칙)에서 "책임"은 어떻게 식별하나요?

**A.** **"변경 이유는 누가 요구하는가?"** 로 묻습니다.

- 결제 정책 변경 → 재무팀.
- 출력 포맷 변경 → 디자인팀.
- DB 스키마 변경 → DBA/플랫폼팀.

이해관계자가 다르면 책임이 다릅니다. "기능이 다르다"가 아니라 "변경 요구의 출처가 다르다"가 기준입니다.

---

## Q4. OCP(개방-폐쇄 원칙)는 어떻게 지키나요?

**A.** **새 기능 추가 = 새 클래스 추가**, 기존 클래스 수정은 최소화하는 것입니다.

```java
// 위반
class Order {
    int discount(String type) {
        if (type.equals("VIP")) return ...;
        if (type.equals("COUPON")) return ...;
    }
}

// 준수
interface Discount { int apply(int price); }
class VipDiscount implements Discount { ... }
class CouponDiscount implements Discount { ... }
```

다만 **OCP는 절대 원칙이 아닙니다**. 확장 포인트를 무한히 만들면 복잡도가 폭발합니다. 변경 가능성이 명확할 때만 적용합니다.

---

## Q5. LSP(리스코프 치환 원칙) 위반의 대표 예시는?

**A.** **`Square extends Rectangle`** 이 단골입니다.

```java
class Rectangle { void setWidth(int w); void setHeight(int h); }
class Square extends Rectangle {
    void setWidth(int w) { super.setWidth(w); super.setHeight(w); }
}
```

`Rectangle`을 받는 코드가 `setWidth`로 너비만 바꾸려는데 `Square`를 넣으면 height까지 바뀝니다 → LSP 위반.

원칙: **자식 타입을 넣어도 부모 타입의 계약(동작)이 그대로** 유지되어야 합니다. 안 되면 상속 관계 자체가 잘못된 것.

---

## Q6. ISP(인터페이스 분리 원칙)는 왜 필요한가요?

**A.** **클라이언트가 안 쓰는 메서드에 의존하지 않게** 하기 위해서입니다.

```java
// 위반 — 너무 많은 책임
interface Worker { void work(); void eat(); void sleep(); }

// 준수 — 작게 분리
interface Workable { void work(); }
interface Eatable { void eat(); }
```

큰 인터페이스 하나는 변경 시 무관한 클라이언트까지 다시 빌드/배포되어야 하는 결합을 만듭니다. 작은 인터페이스 여러 개가 이런 결합을 끊어줍니다.

---

## Q7. DIP와 DI는 다른 건가요?

**A.** 다릅니다. **층위가 다릅니다**.

- **DIP(Dependency Inversion Principle)**: SOLID 원칙. **추상에 의존**하라.
- **DI(Dependency Injection)**: 구현 기법. 의존성을 외부에서 주입.

DI 없이도 DIP를 지킬 수 있고(메인에서 손으로 wiring), 컨테이너 없이도 DI는 가능합니다. DIP는 설계 원칙, DI는 그 실현 도구라고 보면 됩니다.

---

## Q8. 상속과 합성 중 무엇을 선호하시나요?

**A.** **합성(composition)** 입니다. "is-a"가 명확히 성립하지 않으면 합성.

상속 단점:
- 부모 변경이 모든 자식에 영향.
- 컴파일 시점에 결정되어 런타임 교체 불가.
- 다중 상속 어려움(언어 따라).

합성 장점:
- 런타임 교체 가능.
- 결합도 낮음.
- 인터페이스로 다형성 충분.

전략 패턴, 데코레이터 패턴이 합성 기반의 대표 예시입니다.

---

## Q9. 모든 코드에 SOLID를 다 지키시나요?

**A.** **상황에 맞춰 트레이드오프**합니다. 다 지키려 하면 복잡도가 폭발합니다.

우선순위:
1. **SRP/DIP**: 거의 항상 효과 큼.
2. **OCP**: 변경 가능성이 명확할 때.
3. **ISP**: 인터페이스가 비대해질 때.
4. **LSP**: 상속을 쓸 때만.

도구라기보다 **냄새 감지기**입니다. SRP 위반이 보이면 "변경 이유가 섞였나?"를 점검하고, 그게 실제 문제로 이어질 때만 분리합니다.
