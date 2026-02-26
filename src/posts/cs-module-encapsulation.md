---
title: "모듈 캡슐화(Module Encapsulation): 얽힌 코드 풀며 느낀 점"
description: "소프트웨어의 복잡성을 제어하기 위해 모듈화와 캡슐화를 실무에 적용해 보며 깨달은 점들을 정리합니다."
date: "2026-02-26"
tags: ["CS", "Architecture"]
---

# 모듈 캡슐화(Module Encapsulation): 얽힌 코드 풀며 느낀 점

프로젝트 규모가 커질수록 예상치 못한 곳에서 버그가 발생하는 경험을 자주 겪었습니다. 단순히 코드를 잘 짜는 것을 넘어, 구조적으로 안정을 찾는 방법을 고민하다가 **모듈화(Modularization)**와 **캡슐화(Encapsulation)**의 중요성을 실감하게 되었습니다.

---

## 🧱 모듈(Module) 단위의 분리

초기에는 기능 구현에 초점을 맞추다 보니, 수백 줄이 넘어가는 거대한 파일들을 양산하곤 했습니다. 이후 코드를 물리적, 논리적인 단위인 **모듈**로 분리하는 작업을 진행했습니다.

- 프론트엔드에서는 재사용 가능한 UI 컴포넌트로 분리.
- 백엔드에서는 비즈니스 로직 단위의 서비스 파일로 분리.

이렇게 기능을 쪼개어 독립적인 모듈로 구성하니, 특정 버그가 발생했을 때 전체 코드를 탐색할 필요 없이 해당 모듈 파일만 디버깅하면 되어 유지보수가 한결 수월해졌습니다.

---

## 🛡️ 무너진 캡슐화가 부른 참사

모듈을 단순히 물리적으로 나누는 것만으로는 부족했습니다. 과거 회원 지갑(Wallet) 기능을 구현할 때 겪었던 문제를 예로 들어보겠습니다.

### 안 좋은 예: 데이터가 모두 노출된 구조
```typescript
class UserWallet {
    // 잔액 데이터가 외부에 노출됨
    public balance: number; 

    constructor(initialBalance: number) {
        this.balance = initialBalance;
    }
}

const myWallet = new UserWallet(1000);
// 다른 컴포넌트나 비즈니스 로직에서 잔액을 직접 조작해 버리는 문제 발생
myWallet.balance = 50000; 
```

당시 여러 개발자가 협업하는 과정에서, 특정 서비스 로직이 지갑 모듈 내부의 `balance` 변수에 강제로 접근해 값을 수정하는 일이 발생했습니다. 이로 인해 잔액 추적 로그가 누락되고 데이터 정합성이 깨지는 심각한 버그를 겪었습니다. 서로 다른 모듈이 내부 구현까지 상세히 알고 간섭하면서 발생한 문제였습니다.

---

## 🔒 정보 은닉(Information Hiding)과 인터페이스 노출

이 문제를 해결하기 위해, 객체의 내부 데이터를 철저히 숨기고, 승인된 수단(메서드)으로만 상호작용하도록 클래스를 리팩토링했습니다. 이것이 바로 **캡슐화**와 **정보 은닉**이었습니다.

### 개선된 예: 캡슐화 적용
```typescript
class UserWallet {
    // 내부 상태를 숨김
    private balance: number; 

    constructor(initialBalance: number) {
        this.balance = initialBalance;
    }

    // 외부에 공개된 유일한 조작 수단 (인터페이스)
    public deposit(amount: number): void {
        if (amount > 0) {
            this.balance += amount;
            // 이곳에서 로깅 처리 등을 일괄적으로 통제
        }
    }

    public getBalance(): number {
        return this.balance;
    }
}

const myWallet = new UserWallet(1000);
myWallet.deposit(500); 
```

데이터 접근 제어자(`private`)를 통해 내부 상태를 숨기고 `deposit`이라는 공개 메서드(인터페이스)만 노출했습니다. 외부 코드는 이 지갑이 내부적으로 어떻게 돈을 저장하는지 몰라도 입금 요청만 하면 되기 때문에, 결합도가 낮아졌습니다.

---

## 💡 회고

이러한 경험을 통해, 캡슐화란 단순히 `private` 키워드를 붙이는 문법적 요소가 아니라 **"내부 구현의 변경이 외부로 전파되는 것을 차단하는 설계 원칙"**임을 깨달았습니다. 초기 설계 시 접근 제어자를 설정하는 것이 번거롭게 느껴질 수 있지만, 이를 통해 얻는 시스템의 안정성과 유연성은 그 수고로움을 상회한다는 것을 배웠습니다.
