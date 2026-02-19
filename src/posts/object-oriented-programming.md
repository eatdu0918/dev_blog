---
title: '객체 지향 프로그래밍(OOP) 핵심 개념과 코드'
date: '2026-02-18'
categories: ['Programming', 'CS']
---

# 객체 지향 프로그래밍 (OOP)

객체 지향 프로그래밍(Object-Oriented Programming, OOP)은 복잡한 문제를 **상호작용하는 객체들의 집합**으로 해결하려는 프로그래밍 패러다임입니다.
단순히 코드를 작성하는 방법을 넘어, **유지보수가 쉽고 유연한 소프트웨어**를 만들기 위한 핵심 철학입니다.

OOP를 지탱하는 4가지 강력한 기둥(4대 특성)에 대해 자세히 알아보고, TypeScript 코드로 어떻게 구현되는지 살펴보겠습니다.

---

## 1. 캡슐화 (Encapsulation)

캡슐화는 **관련된 데이터와 동작을 하나로 묶고**, 외부에서 불필요하게 접근하지 못하도록 **정보를 숨기는(Information Hiding)** 것을 의미합니다.

### 왜 필요한가요?
- **데이터 보호**: 외부에서 실수로 데이터를 망가뜨리는 것을 방지합니다.
- **유지보수성**: 객체 내부의 구현이 바뀌어도, 외부에 노출된 메서드 사용법만 같다면 나머지 코드는 수정할 필요가 없습니다.

### 코드 예시
은행 계좌(`BankAccount`)를 생각해 봅시다. 잔액(`balance`)을 누구나 마음대로 수정할 수 있다면 큰일나겠죠? `private` 키워드로 숨기고, 오직 `deposit`(입금) 메서드를 통해서만 수정하도록 강제합니다.

```typescript
class BankAccount {
  // 데이터 숨기기 (private)
  private balance: number = 0;

  // 데이터를 조작할 수 있는 유일한 통로 (public method)
  deposit(amount: number) {
    if (amount > 0) {
      this.balance += amount;
      console.log(`입금 성공: ${amount}원`);
    }
  }

  // 데이터 조회 (읽기 전용)
  getBalance() {
    return this.balance;
  }
}

const myAccount = new BankAccount();
myAccount.deposit(1000); // 가능
// myAccount.balance = 5000000; // 에러! 직접 접근 불가능
```

---

## 2. 상속 (Inheritance)

상속은 **이미 존재하는 클래스(부모)의 모든 기능을 물려받아 새로운 클래스(자식)를 만드는 것**입니다.

### 왜 필요한가요?
- **코드 중복 제거**: 똑같은 코드를 여러 번 짤 필요 없이, 공통 기능은 부모 클래스에 한 번만 작성하면 됩니다.
- **계층 구조 표현**: '동물' 아래 '개', '고양이'가 있듯이, 자연스러운 구조를 코드로 표현할 수 있습니다.

### 코드 예시
모든 동물은 움직일 수 있습니다. `Dog` 클래스는 `Animal` 클래스를 상속받아 `move()` 기능을 그대로 물려받고, 자신만의 기능인 `bark()`를 추가합니다.

```typescript
// 부모 클래스
class Animal {
  name: string;
  constructor(name: string) { this.name = name; }
  
  move() { 
    console.log(`${this.name}이(가) 이동합니다.`); 
  }
}

// 자식 클래스 (Animal을 상속받음)
class Dog extends Animal {
  bark() { 
    console.log("멍멍!"); 
  }
}

const myDog = new Dog("바둑이");
myDog.move(); // 부모에게 물려받은 기능 사용
myDog.bark(); // 자식 고유의 기능 사용
```

---

## 3. 추상화 (Abstraction)

추상화는 복잡한 내부 구현은 감추고, **사용자에게 필요한 단순한 인터페이스만 노출하는 것**입니다. "어떻게(How)" 동작하는지보다 "**무엇(What)**을 하는지"에 집중합니다.

### 왜 필요한가요?
- **복잡도 관리**: 사용자는 내부 회로가 어떻게 얽혀있는지 몰라도 리모컨 버튼만 누르면 TV를 켤 수 있습니다.
- **유연함**: 구체적인 구현체 대신 인터페이스(규격)에 의존하면, 나중에 구현체가 바뀌어도 코드를 크게 뜯어고칠 필요가 없습니다.

### 코드 예시
리모컨(`RemoteControl`)이라는 인터페이스(규격)를 정의합니다. TV 리모컨이든 에어컨 리모컨이든 "켜기/끄기" 기능이 있다는 것은 동일합니다.

```typescript
// 인터페이스: "무엇을 해야 하는지"만 정의
interface RemoteControl {
  turnOn(): void;
  turnOff(): void;
}

// 구현체: "어떻게 하는지"를 구체적으로 구현
class TVRemote implements RemoteControl {
  turnOn() { console.log("TV 전원을 켭니다."); }
  turnOff() { console.log("TV 전원을 끕니다."); }
}
```

---

## 4. 다형성 (Polymorphism)

다형성은 **하나의 변수나 함수가 상황에 따라 다른 형태를 띨 수 있는 능력**입니다.

### 왜 필요한가요?
- **확장성**: 새로운 타입의 객체가 추가되어도 기존 코드를 수정하지 않고 유연하게 대처할 수 있습니다.
- **오버라이딩(Overriding)**: 부모가 물려준 기능을 자식 스타일에 맞게 재정의할 수 있습니다.

### 코드 예시
`Shape`(도형)라는 부모 클래스에 `draw()` 메서드가 있습니다. `Circle`과 `Square`는 서로 그리는 방식이 다르지만, 모두 `Shape`의 일종이므로 똑같이 `draw()`를 호출할 수 있습니다.

```typescript
class Shape {
  draw() { console.log("도형을 그립니다."); }
}

class Circle extends Shape {
  // 오버라이딩: 부모의 메서드를 재정의
  draw() { console.log("동그라미를 그립니다 🔴"); }
}

class Square extends Shape {
  draw() { console.log("네모를 그립니다 🟦"); }
}

// 다형성의 힘: 모두 Shape 타입이지만 실제 동작은 제각각임
const shapes: Shape[] = [new Circle(), new Square()];

shapes.forEach(shape => {
  shape.draw(); // 각자의 방식대로 그려짐
});
```

---

## 마치며

객체 지향 프로그래밍은 처음에는 어렵게 느껴질 수 있지만, **"코드를 현실 세계의 사물(객체)처럼 다룬다"**는 기본 원칙만 기억하면 됩니다. 이 4가지 개념을 잘 활용하면, 시간이 지나도 튼튼하고 수정하기 쉬운 프로그램을 만들 수 있습니다.
