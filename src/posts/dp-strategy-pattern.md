---
title: "전략(Strategy) 패턴: 런타임에 유연하게 알고리즘을 교체하며 배운 객체 지향의 원리"
date: "2026-02-27"
description: "상황에 따라 동작 방식을 갈아 끼우는 전략 패턴의 원리를 분석하고, 결제 시스템을 타입스크립트로 구현해보며 얻은 설계의 통찰을 공유합니다."
---

결제 서비스처럼 다양한 수단(카드, 카카오페이, 네이버페이, 휴대폰 결제 등)을 지원해야 하는 기능에서, 새로운 수단이 추가될 때마다 기존 코드의 거대한 `if-else` 블록을 끝없이 이어 붙여야 하는 난감한 상황에 놓이곤 했습니다. 코드가 길어지고 가독성이 떨어지는 것은 물론이거니와, 다른 수단에서 발생한 lỗi(버그)가 전혀 관계없는 수단까지 영향을 미치는 예상치 못한 사이드 이펙트를 걱정해야만 했습니다.

비슷한 동작을 하지만 구체적인 방식만 다른 여러 알고리즘을 상황에 따라 유연하게 갈아 끼울 수 있도록 고안된 디자인 패턴이 '전략(Strategy) 패턴'임을 학습하고, 이를 실제 형태의 결제 모듈 코드로 적용해 보았습니다.

## 갈아 끼우는 부품과 같은 알고리즘 

자동차의 타이어를 펑크가 나거나 노면에 맞게 언제든 다른 타이어로 교체하듯, 소프트웨어에서도 큰 골격은 그대로 둔 채 특정한 작업을 수행하는 핵심 '전략(Strategy)'만 외부에서 주입하여 동작을 결정짓게 합니다.

- 전략 인터페이스 구조를 정의하여, 각 구체적인 전략 클래스가 그것을 상속하고 구현하도록 만듭니다.
- 작업을 수행할 때는 구체적인 클래스가 아니라 '인터페이스' 타입에 의존함으로써 런타임 환경에서도 자유로운 교체가 가능해집니다.

<img src="/images/strategy_pattern_concept.png" alt="전략 패턴 개념 다이어그램" style="max-width: 100%;" />
*컨텍스트 객체가 퍼즐 조각을 갈아끼우듯 다양한 전략을 교체하여 동작하는 모습*

## TypeScript 결제 시스템 예제로 보는 전략 패턴

다양한 수단으로 결제를 진행하는 상황을 가정하여, 전략 패턴이 없다면 생길 수평적 조건 문의 복잡함을 어떻게 지워내는지 확인해 보겠습니다.

```typescript
// 1. 모든 결제 전략이 가져야 할 동일한 규격 (Interface)
interface PaymentStrategy {
  pay(amount: number): string;
}

// 2. 구체화된 여러 전략들 (Concrete Strategies)
class CreditCardStrategy implements PaymentStrategy {
  constructor(private name: string, private cardNumber: string) {}

  pay(amount: number): string {
    return `${this.name}님의 신용카드(${this.cardNumber})로 ${amount}원이 결제되었습니다.`;
  }
}

class TossPayStrategy implements PaymentStrategy {
  constructor(private phoneNumber: string) {}

  pay(amount: number): string {
    return `토스페이(${this.phoneNumber})로 ${amount}원이 간편 결제되었습니다.`;
  }
}

// 3. 결제 로직을 다루는 컨텍스트 클래스 (Context)
class ShoppingCart {
  private items: { name: string; price: number }[] = [];
  
  // 상황에 따라 결제 전략을 담아둘 주머니
  private paymentStrategy: PaymentStrategy | null = null;

  addItem(name: string, price: number) {
    this.items.push({ name, price });
  }

  // 런타임에 결제 수단(전략)을 교체할 수 있는 메서드
  setPaymentStrategy(strategy: PaymentStrategy) {
    this.paymentStrategy = strategy;
  }

  checkout(): string {
    const total = this.items.reduce((sum, item) => sum + item.price, 0);
    
    if (!this.paymentStrategy) {
      throw new Error('결제 수단을 먼저 선택해주세요.');
    }
    
    // 핵심 동작을 현재 주입되어 있는 전략 객체에게 그대로 위임(Delegation)
    return this.paymentStrategy.pay(total);
  }
}

// 사용 예시
const cart = new ShoppingCart();
cart.addItem('무선 이어폰', 150000);

// 사용자가 결제 전, 신용카드를 선택했을 때
cart.setPaymentStrategy(new CreditCardStrategy('James', '1234-5678-9012-3456'));
console.log(cart.checkout()); // "James님의 신용카드(...)로 150000원이 결제되었습니다."

// 사용자가 중간에 마음이 바뀌어 토스페이로 전략을 변경했을 때
cart.setPaymentStrategy(new TossPayStrategy('010-1234-5678'));
console.log(cart.checkout()); // "토스페이(...)로 150000원이 간편 결제되었습니다."
```

단순히 `pay()`라는 함수 호출 자체는 변하지 않았지만, 내부에서 작동하는 로직이 카드를 사용할지 간편 결제를 사용할지 런타임 환경에서 즉각적으로 변화했습니다. `if-else` 분기문이 장황하게 나열되어 있을 때보다 가독성이 훨씬 올라갔습니다.

## 유지보수와 확장에 열려있는 구조를 경험하다

전략 패턴을 적용해 본 후 가장 먼저 들었던 생각은 "새로운 결제 수단(예: PayPal, 비트코인 등)이 들어와도 메인 로직인 `ShoppingCart` 내부의 결제 프로세스를 단 한 줄도 고칠 필요가 없겠구나!" 였습니다. `PaymentStrategy` 인터페이스를 구현하는 클래스 하나를 외부 공간에 툭 만들어주고, 필요할 때 `setPaymentStrategy`로 주입해 주면 그만이었습니다.

다른 패턴들 중에서도 '의존성 주입(Dependency Injection, DI)'의 강점을 이보다 더 직관적으로 드러내는 패턴은 찾기 힘들다는 걸 깨달았습니다. 서로가 서로의 내부에 존재하는 상태나 복잡한 알고리즘을 알 필요 없이 오직 약속된 '인터페이스'로서만 통신함으로써 캡슐화를 극대화했다는 점이 매력적이었습니다. 결국 객체 지향 프로그래밍 설계 철학의 정수인 다형성(Polymorphism)을 활용하면 복잡한 수평적 조건을 해결할 수 있다는 소중한 배움을 얻었습니다.
