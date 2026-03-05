---
published: true
title: '다형성과 명시적 시그니처: 예측 가능한 코드의 핵심'
date: '2026-03-03'
categories: ['Programming', 'CS']
---

# 다형성과 명시적 시그니처: 예측 가능한 코드의 핵심

초기에는 동적 언어의 유연함이 주는 매력에 푹 빠져 있었습니다. 어떤 객체가 들어올지 정확히 모르더라도 대충 `draw()` 가 있겠거니 하고 실행했는데, 가끔 런타임에 에러가 나면 원인을 찾느라 밤을 지새우기도 했습니다.

그러다 객체 지향의 **다형성(Polymorphism)**과 이를 뒷받침하는 **명시적 시그니처(Explicit Contract)**라는 개념을 접하게 되었습니다. 단순한 문법적 특징을 넘어, 협업과 유지보수의 관점에서 이 개념이 주는 강력한 힘을 실감하며 학습한 내용을 정리해 봅니다.

---

## 1. 다형성: 하나의 약속, 여러 가지 구현

다형성이란 "하나의 인터페이스나 추상 클래스가 여러 가지 다른 형태로 동작할 수 있는 성질"을 말합니다. 말은 어렵지만, 핵심은 **"무엇(What)"을 하는지는 같지만, "어떻게(How)" 하는지는 각자가 다를 수 있다는 것**입니다.

이때 **명시적 시그니처**는 "이 객체를 쓰려면 무조건 이 규칙(메서드 이름, 매개변수, 반환 타입)을 지켜야 한다"는 일종의 약속, 즉 **계약(Contract)** 역할을 합니다.

![다형성과 명시적 시그니처 개념](/public/images/polymorphism_explicit_contract_concept.png)

위 그림처럼 '도형(Shape)'이라는 추상적인 계약이 있고, 그 아래에 '원(Circle)', '사각형(Square)' 등이 이 계약을 충족하도록 설계되어 있다면, 우리는 이 객체들이 어떤 것이든 상관없이 안심하고 사용할 수 있습니다.

---

## 2. 실전 예제: 약속된 인터페이스로 유연해지기

프로그래밍을 하며 가장 많이 사용하게 되는 '도형 면적 계산' 예제를 통해 이 개념을 녹여보겠습니다.

### 계약(Contract) 정의하기

```typescript
// 명시적 시그니처 정의 (인터페이스)
interface Shape {
  getArea(): number; // "면적을 구하고 숫자를 반환해야 한다"는 명확한 규정
}
```

### 다양한 구현(Polymorphism)

```typescript
class Circle implements Shape {
  constructor(private radius: number) {}

  getArea(): number {
    return Math.PI * this.radius ** 2; // 원의 방식대로 면적 계산
  }
}

class Square implements Shape {
  constructor(private side: number) { }

  getArea(): number {
    return this.side ** 2; // 사각형의 방식대로 면적 계산
  }
}
```

### 다형성 활용하기

```typescript
// 클라이언트 코드는 Shape 계약만 알고 있으면 됩니다. 
// 구체적인 구현(Circle인지 Square인지)에는 관심이 없습니다.
function calculateTotalArea(shapes: Shape[]): number {
  return shapes.reduce((acc, shape) => acc + shape.getArea(), 0);
}
```

이렇게 명시적인 계약을 맺어두면, 새로운 '삼각형(Triangle)' 클래스가 추가되더라도 `calculateTotalArea` 함수는 단 한 줄의 코드 수정 없이도 완벽하게 작동합니다.

---

## 3. 깨달음과 성장

그동안 다형성이 "그냥 타입을 통일해주는 기능" 정도로만 생각했습니다. 하지만 이번 학습을 통해 다형성의 진정한 가치는 **'계약에 의한 설계(Design by Contract)'**에 있다는 것을 깊이 깨달았습니다.

명시적 시그니처를 통해 규격을 정하면, 그 규격 안에서 각 클래스는 자신만의 방식으로 자유롭게 동작할 수 있는 자율성을 얻게 됩니다. 이는 곧 코드의 예측 가능성을 높이고, 에러를 배포 전(Compile-time)에 잡아낼 수 있는 견고한 방패가 되어 주었습니다.

---

## 회고

코드를 짤 때 "어차피 내가 나중에 쓸 건데 대충 이름 지어두지 뭐"라고 생각하며 명시적인 설계를 건너뛰곤 했었습니다. 하지만 그때의 나를 돌아보며 반성하게 되었습니다. 나중의 내가, 혹은 동료가 고통받지 않으려면 처음부터 명확한 계약을 맺고 다형성을 올바르게 설계하는 것이 무엇보다 중요하다는 것을 가슴 깊이 새기게 되었습니다.
