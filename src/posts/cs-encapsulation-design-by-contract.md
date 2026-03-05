---
published: true
title: '캡슐화와 계약: 견고한 객체를 만드는 두 개의 기둥'
date: '2026-03-03'
categories: ['Programming', 'CS']
---

# 캡슐화와 계약: 견고한 객체를 만드는 두 개의 기둥

프로젝트를 진행하다 보면 객체의 내부 상태가 예상치 못한 곳에서 바뀌어 버그를 추적하느라 며칠을 허비한 경험이 한 번쯤은 있으실 겁니다. 저 또한 누군가 실수로 변경한 데이터 때문에 시스템 전체가 흔들리는 상황을 겪으며 **캡슐화(Encapsulation)**의 중요성을 절감했습니다.

하지만 단순히 데이터를 숨기는 것만으로는 부족했습니다. 그 데이터를 **어떻게(안전하게) 다룰 것인가**에 대한 명확한 규칙, 즉 **계약에 의한 설계(Design by Contract, DbC)**가 함께할 때 비로소 객체는 진정한 신뢰를 얻을 수 있음을 알게 되었습니다.

---

## 1. 캡슐화: 데이터의 보호막

캡슐화는 객체의 상태(필드)를 외부에서 직접 수정하지 못하도록 `private`으로 감추고, 오직 **검증된 메서드(Public API)**를 통해서만 대화하게 하는 기법입니다.

![캡슐화와 계약의 조화](/public/images/encapsulation_design_by_contract_concept.png)

위 그림처럼 캡슐화가 객체의 내부를 안전하게 보호하는 보호막이라면, 그 표면에 적힌 **계약(Rule)**들은 이 객체가 올바르게 작동하기 위해 지켜야 할 약속들을 의미합니다.

---

## 2. 계약에 의한 설계 (Design by Contract, DbC)

DbC는 세 가지 핵심 요소를 통해 객체의 안정성을 보장합니다.

1. **사전 조건(Preconditions)**: 메서드가 실행되기 전에 "반드시" 충족해야 하는 조건입니다. (예: 입금액은 0보다 커야 함)
2. **사후 조건(Postconditions)**: 메서드가 실행된 후에 "반드시" 보장되는 결과입니다. (예: 잔액이 정확히 입금액만큼 증가해야 함)
3. **불변 항목(Invariants)**: 객체가 생성된 이후 생명주기 동안 "언제나" 참이어야 하는 조건입니다. (예: 계좌 잔액은 절대 음수일 수 없음)

---

## 3. 실전 예제: 안전한 계좌 클래스 만들기 (TypeScript)

캡슐화와 DbC를 적용하여 견고한 `BankAccount` 클래스를 설계해 보았습니다.

```typescript
class BankAccount {
  private balance: number = 0; // 캡슐화: 외부에서 직접 수정 불가

  deposit(amount: number): void {
    // 1. 사전 조건(Preconditions): 입금액이 0보다 커야 함
    if (amount <= 0) {
      throw new Error('입금액은 0보다 커야 합니다.');
    }

    const previousBalance = this.balance;
    this.balance += amount;

    // 2. 사후 조건(Postconditions): 합계가 정확한지 보장
    if (this.balance !== previousBalance + amount) {
      throw new Error('결제 시스템에 무결성 오류가 발생했습니다.');
    }
  }

  withdraw(amount: number): void {
    // 1. 사전 조건: 인출액은 양수여야 하며, 잔액이 충분해야 함
    if (amount <= 0) throw new Error('인출액은 0보다 커야 합니다.');
    if (amount > this.balance) throw new Error('잔액이 부족합니다.');

    this.balance -= amount;
    
    // 3. 불변 항목(Invariants): 잔액은 언제나 0 이상이어야 함
    this.checkInvariants();
  }

  private checkInvariants() {
    if (this.balance < 0) {
       throw new Error('무결성 위반: 잔액은 0원 이상이어야 합니다.');
    }
  }

  getBalance(): number { return this.balance; }
}
```

이렇게 하면 객체 내부에서 스스로 "내가 올바른 상태인가?"를 판단하기 때문에, 외부 코드 어디에서나 안심하고 이 클래스를 가져다 쓸 수 있습니다. 설령 호출하는 쪽에서 실수하더라도 사전 조건 검사에서 차단되기 때문에 버그의 전이를 막을 수 있었습니다.

---

## 4. 깨달음과 성장

캡슐화는 단순히 정보를 숨기는 게 아니라, **객체 스스로 책임을 지게 만드는 것**이었습니다. 그리고 DbC 그 책임을 명확하게 규정하는 장치였습니다.

이 개념들을 적용해보며 느낀 가장 큰 변화는 **"에러 해결이 빨라졌다"**는 것입니다. 문제가 발생하면 해당 객체의 어떤 계약(사전/사후/불변)이 깨졌는지만 확인하면 되기 때문입니다. 객체를 독립된 하나의 '작은 프로그램'으로 대하기 시작하자 시스템 전체를 바라보는 관점도 성숙해졌음을 실감합니다.

---

## 회고

예전에는 "에러가 나면 호출하는 쪽에서 잘 처리해주겠지"라는 안일한 생각으로 클래스를 짜곤 했습니다. 하지만 그런 코드는 결국 프로젝트 후반에 큰 부채로 돌아왔습니다. 이제는 클래스 하나를 만들더라도 **"자신의 상태는 스스로 책임지는 견고한 객체"**를 만드는 것을 원칙으로 삼고 있습니다.
