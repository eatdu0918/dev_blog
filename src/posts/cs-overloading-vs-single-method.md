---
published: true
title: '오버로딩인가, 다형성인가? 유연한 메서드 설계의 고민'
date: '2026-03-03'
categories: ['Programming', 'CS']
---

# 오버로딩인가, 다형성인가? 유연한 메서드 설계의 고민

개발을 하다 보면 같은 기능을 수행하지만 입력값이 다른 메서드들을 설계해야 할 때가 있습니다. 처음에는 단순히 같은 이름의 메서드를 파라미터만 다르게 해서 여러 개 만드는 '오버로딩'이 가장 직관적이고 편리하다고 생각했습니다. 

하지만 새로운 타입이 추가될 때마다 기존 클래스를 계속 수정해야 하는 한계를 마주했고, 이를 해결하는 과정에서 **동적 다형성(Dynamic Polymorphism)**으로의 전환이라는 중요한 설계적 깨달음을 얻게 되었습니다.

---

## 1. 정적 다형성(오버로딩) vs 동적 다형성(오버라이딩)

둘 다 '다형성'의 범주에 속하지만, 동작 방식과 설계 목적이 다릅니다.

- **오버로딩(Overloading)**: 같은 이름의 메서드를 다른 시그니처(파라미터 개수나 타입)로 정의하는 것입니다. '컴파일 타임'에 어떤 메서드가 호출될지 결정됩니다.
- **다형성/오버라이딩(Dynamic Polymorphism)**: 부모 클래스의 메서드를 자식 클래스에서 재정의하는 것입니다. '런타임'에 실제 객체의 타입에 따라 어떤 메서드가 호출될지 결정됩니다.

![오버로딩 vs 다형성 개념](/public/images/overloading_vs_polymorphism_concept.png)

위 그림처럼, 오버로딩은 하나의 기계에 다양한 입력을 넣는 것과 같고, 다형성은 각기 다른 개성을 가진 기계들이 동일한 '시작' 버튼에 저마다의 방식으로 반응하는 것과 같습니다.

---

## 2. 실전 예제: 로깅 시스템의 리팩토링

TypeScript에서 두 가지 접근 방식을 비교해 보겠습니다.

### AS-IS: 오버로딩 방식의 Logger

```typescript
class Logger {
  log(message: string): void;
  log(error: Error): void;
  log(data: object): void;
  log(arg: any): void {
    if (typeof arg === 'string') {
      console.log(`MSG: ${arg}`);
    } else if (arg instanceof Error) {
      console.log(`ERR: ${arg.message}`);
    } else {
      console.log(`DATA: ${JSON.stringify(arg)}`);
    }
  }
}
```

오버로딩은 편리하지만, **"새로운 로그 타입이 추가될 때마다 `Logger` 클래스 본문을 수정해야 한다"**는 치명적인 단점이 있습니다. 클래스가 너무 많은 책임을 갖게 되는 것이죠.

### TO-BE: 다형성 방식 (Single Method)

```typescript
// 로그의 형식을 정의하는 인터페이스 (계약)
interface Loggable {
  format(): string;
}

// 각 로그 타입이 자신의 형식을 결정함 (자율성)
class StringLog implements Loggable {
  constructor(private msg: string) {}
  format() { return `MSG: ${this.msg}`; }
}

class ErrorLog implements Loggable {
  constructor(private err: Error) {}
  format() { return `ERR: ${this.err.message}`; }
}

// Logger는 이제 단 하나의 메서드만 가지며, Loggable 인터페이스에 의존합니다.
class UniversalLogger {
  log(item: Loggable) {
    console.log(item.format());
  }
}
```

이제 새로운 로그 타입(예: NetworkLog)이 추가되어도 `UniversalLogger`는 단 한 줄도 수정할 필요가 없습니다. 새로운 클래스를 만들고 `Loggable`만 구현하면 되기 때문입니다.

---

## 3. 깨달음과 성장

오버로딩은 메서드 이름에 일관성을 부여하지만, 클래스 내부의 분기 처리로 인해 코드가 복잡해지는 결과를 낳곤 했습니다. 반면, 인터페이스를 활용한 단일 메서드 기반의 다형성은 각 타입별로 책임을 분산시켜 클래스를 가볍게 유지할 수 있게 해주었습니다.

"어디서 동작을 결정할 것인가?"라는 질문에 대해, 이전에는 중앙 집중식(오버로딩)으로 해결하려 했다면 이제는 각 객체가 스스로를 책임지는 자율적 방식(다형성)으로 고민의 방향을 틀었습니다.

---

## 회고

그동안은 단순히 코드를 적게 짜기 위해 오버로딩을 선호했었습니다. 하지만 확장에 열려 있는(Open-Closed Principle) 설계를 위해서는 다형성을 더 적극적으로 고려해야 한다는 것을 깨달았습니다. 기술적인 도구는 상황에 맞게 골라 써야 하지만, 시스템의 유연성을 위해서는 자율적인 객체들의 연합을 만드는 것이 더 큰 가치가 있다는 것을 배웠습니다.
