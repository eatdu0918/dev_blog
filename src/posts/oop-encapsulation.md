---
published: true
title: '캡슐화(Encapsulation): 객체의 내부를 보호하고 책임을 명확히 하기'
date: '2026-03-05'
categories: ['Programming', 'CS', 'OOP']
---

# 캡슐화(Encapsulation): 객체의 내부를 보호하고 책임을 명확히 하기

웹 애플리케이션의 규모가 커질수록 데이터의 흐름을 추적하는 일은 점점 더 고통스러워집니다. 특히 여러 함수나 모듈이 동일한 상태 데이터에 직접 접근하여 수정할 수 있는 구조라면, 특정 시점에 데이터가 왜 그렇게 변했는지 파악하기 위해 수많은 파일을 뒤져야 합니다.

이런 혼란을 해결하고 코드의 신뢰성을 높이기 위해 도입한 개념이 바로 **캡슐화(Encapsulation)**입니다.

![캡슐화 시각화](/public/images/oop-encapsulation.png)

## 왜 캡슐화가 중요한가?

캡슐화는 단순히 데이터와 이를 다루는 로직을 하나로 묶는 것 이상의 의미를 가집니다. 가장 핵심적인 가치는 **'정보 은닉(Information Hiding)'**을 통해 객체의 무결성을 보장하는 것입니다.

과거에 작성했던 장바구니 로직을 예로 들어보겠습니다. 초기에는 상품 목록과 총 금액을 일반 객체로 관리하며 어디서든 직접 수정할 수 있게 두었습니다.

```typescript
// 위험한 접근 방식: 외부에서 데이터를 직접 조작
const cart = {
  items: [],
  totalPrice: 0
};

// 누군가 실수로 totalPrice를 음수로 바꾼다면?
cart.totalPrice = -1000; 
```

이런 방식은 데이터가 오염될 가능성을 항상 열어둡니다. 반면 캡슐화를 적용하면 객체 스스로가 자신의 상태를 지키는 파수꾼 역할을 하게 됩니다.

## 실전 예제: 자판기 로직 리팩토링

자판기의 잔액과 상품 수량을 관리하는 로직에 캡슐화를 적용해 보았습니다. 외부에서는 자판기 내부의 돈이 정확히 얼마인지, 하드웨어가 어떻게 동작하는지 알 필요가 없습니다. 오직 '동전 투입'과 '상품 선택'이라는 정해진 통로(Interface)를 통해서만 상호작용합니다.

```typescript
class VendingMachine {
  private balance: number = 0; // 외부 노출 차단
  private readonly itemPrice: number = 1000;

  // 정해진 규칙을 통해서만 상태 변경 허용
  public insertCoin(amount: number): void {
    if (amount <= 0) return;
    this.balance += amount;
  }

  public purchaseItem(): boolean {
    if (this.balance >= this.itemPrice) {
      this.balance -= this.itemPrice;
      return true;
    }
    return false;
  }

  public getBalance(): number {
    return this.balance;
  }
}
```

이렇게 캡슐화된 객체는 내부 구현이 바뀌어도(예를 들어, 잔액을 DB에 바로 저장하도록 변경되는 등) 외부에서 이 객체를 사용하는 코드에는 아무런 영향을 주지 않습니다.

## 학습을 통해 깨달은 점

캡슐화를 적용하면서 가장 크게 달라진 점은 **'디버깅 범위의 축소'**였습니다. 데이터에 문제가 생겼을 때, 전역을 뒤질 필요 없이 해당 데이터를 소유한 클래스 내부만 확인하면 되기 때문입니다.

결국 캡슐화는 코드를 가두기 위한 것이 아니라, 객체간의 경계를 명확히 하여 전체 시스템을 더 안전하고 예측 가능하게 만들기 위한 도구임을 실감할 수 있었습니다.
