---
published: true
title: '객체 지향 프로그래밍(OOP) 도입과 리팩토링 경험'
date: '2026-02-18'
categories: ['Programming', 'CS']
---

# 객체 지향 프로그래밍(OOP) 도입과 리팩토링 경험

클래스를 선언하고 객체를 인스턴스화한다는 표면적인 문법을 넘어, **객체 지향 프로그래밍(OOP)**의 진짜 개념을 깨닫게 된 것은 절차적으로 작성되어 엉킨 코드를 유지보수하던 때였습니다.

단순히 동작에 중점을 둔 함수 나열식 코드에서 벗어나, 상호작용하는 객체 단위로 시스템을 재설계 시도해보며 경험한 4대 핵심 특성을 회고해 봅니다.

---

## 1. 캡슐화 (Encapsulation) 적용하기

과거의 코드베이스에서는 중요한 상태 데이터가 전역 공간이나 여러 컴포넌트에 노출되어 있었습니다. 누군가 실수로 상태를 덮어쓰게 되면 어디서 문제가 발생했는지 추적하기가 매우 어려웠습니다.

이를 해결하기 위해 캡슐화를 훈련했습니다. 관련된 데이터와 조작 로직을 하나의 클래스로 묶고, 상태는 `private`으로 숨겼습니다. 

```typescript
// 리팩토링 후의 잔액 관리 클래스
class BankAccount {
  private balance: number = 0; // 정보를 은닉하여 외부 오염 방지

  // 검증 로직이 포함된 유일한 조작 창구 제공
  deposit(amount: number) {
    if (amount > 0) {
      this.balance += amount;
    }
  }

  getBalance(): number {
    return this.balance;
  }
}
```

내부 구현 책임을 클래스가 온전히 지도록 강제하자, 사이드 이펙트(Side-Effect) 발생 빈도가 확연히 줄어들음을 경험할 수 있었습니다.

---

## 2. 상속 (Inheritance)을 통한 구조화

비슷한 동작을 하는 컨트롤러 코드를 여러 번 복사해 수정하다 보니 버그 역시 여러 파일에 걸쳐 나타났습니다. 공통적인 초기화 및 로깅 로직을 부모 클래스에 한 번만 작성하고, 변경되는 비즈니스 로직만 자식 클래스가 확장하여 사용하는 방식으로 구조를 개편해 보았습니다.

```typescript
// 공통 기능을 지닌 부모 클래스
class BaseService {
  protected logInit(serviceName: string) {
    console.log(`[INIT] ${serviceName} Service Started.`);
  }
}

// 부모 기능을 물려받고 특화 기능을 더한 자식 클래스
class UserService extends BaseService {
  init() {
    this.logInit("User");
    // User 특화 로직
  }
}
```

중복 코드가 눈에 띄게 감소하여 관리 포인트가 단일화되는 이점이 있었습니다. (추후 상속의 깊이가 깊어져 유연성이 떨어지는 부작용을 겪으며, 맹목적인 상속보다는 조립(Composition)을 병행해야 한다는 것도 깨달았습니다.)

---

## 3. 추상화 (Abstraction)로 의존성 낮추기

처음에는 외부 모듈이나 라이브러리를 사용할 때 구현체 파일에 직접 의존하게 코드를 작성했습니다. 결과적으로 결제 모듈을 A사에서 B사로 변경하라는 요구사항이 주어졌을 때 사실상 코드를 처음부터 새로 짜야 했습니다.

이후 "**어떻게(How)**" 하는지가 아닌 "**무엇(What)**"을 하는지 집중하는 추상화의 개념을 서비스 층에 도입했습니다.

```typescript
// 구현 기술 대신, 행위 규격을 정의한 인터페이스
interface PaymentGateway {
  processPayment(amount: number): boolean;
}

// 특정 구현체에 의존하지 않는 비즈니스 로직
class OrderService {
  constructor(private paymentGateway: PaymentGateway) {}

  checkout(amount: number) {
    this.paymentGateway.processPayment(amount);
  }
}
```

이렇게 인터페이스에 의존하도록 추상화 벽을 치자, 구현체가 어떤 것으로 교체되더라도 핵심 비즈니스 로직 파일은 수정할 필요가 없게 되는 유연함을 경험했습니다.

---

## 4. 다형성 (Polymorphism)과 조건문 탈출

도형을 렌더링하거나 메시지를 발송하는 로직에서 수십 줄에 달하는 `switch/case` 문을 다루느라 고생한 적이 있습니다. 타입이 새로 추가될 때마다 모든 분기문을 찾아가 수정해야 했습니다.

이때 **다형성**을 도입했습니다. 각 타입의 객체가 동일한 메서드 규칙(`draw()` 등)을 자율적으로 재정의하도록 오버라이딩 처리했습니다.

```typescript
abstract class Notification {
  abstract send(msg: string): void; // 다형성 보장을 위한 규격
}

class EmailNotification extends Notification {
  send(msg: string) { console.log(`E-mail 발송: ${msg}`); }
}

class SmsNotification extends Notification {
  send(msg: string) { console.log(`SMS 발송: ${msg}`); }
}

// 조건 분기 없이, 각 객체 스스로 동작을 결정함
const sendors: Notification[] = [new EmailNotification(), new SmsNotification()];
sendors.forEach(s => s.send("알림 테스트"));
```

새로운 알림 수단이 추가되어도 기존 로직(`sendors.forEach...`)은 수정 없이 잘 작동했습니다.

---

## 회고

객체 지향 프로그래밍은 단순히 객체를 만드는 문법이 아니었습니다. 무분별한 의존관계를 정리하고 확장에 유리한 코드로 다듬어나가기 위해, 실무 중 끝없이 고민하게 만드는 설계 나침반과도 같다는 점을 깊이 실감하고 있습니다.
