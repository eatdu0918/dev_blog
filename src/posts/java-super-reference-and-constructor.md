---
published: true
title: "Java의 super와 super(): 상속의 깊은 곳을 연결하는 끈"
description: "상속 관계에서 부모 클래스와 자식 클래스를 잇는 핵심 키워드, super와 super()의 차이점과 동작 원리를 파헤쳐봅니다."
date: "2026-03-13"
tags: ["Backend", "OOP"]
---

# Java의 super와 super(): 상속의 깊은 곳을 연결하는 끈

![Java super 개념도](/public/images/java-super-reference-and-constructor.png)

객체 지향 프로그래밍을 공부하다 보면 '상속(Inheritance)'이라는 강력한 도구를 만나게 된다. 처음에는 단순히 부모의 기능을 물려받아 재사용하는 수준으로만 생각했다. 하지만 실제 코드를 작성하고 확장해 나가다 보니, 부모의 멤버를 명시적으로 가리켜야 하거나 부모의 생성 로직을 그대로 이어받아야 하는 상황들이 발생했다.

이때 우리를 도와주는 두 가지 단짝 친구가 바로 `super`와 `super()`다. 비슷하게 생겼지만 그 역할은 명확히 다른 이 두 키워드를, 내가 직접 겪었던 혼란과 해결 과정을 통해 정리해 보려고 한다.

---

## 1. super: "부모님의 성함을 부르는 법"

`super`는 자식 클래스에서 부모 클래스의 멤버(변수, 메서드)를 참조할 때 사용하는 **참조 변수**다. 

자식 클래스에서 부모와 동일한 이름의 변수나 메서드를 정의(Shadowing or Overriding)했을 때, `this`가 '나'를 가리킨다면 `super`는 명시적으로 '부모'를 가리킨다.

### 내가 겪었던 문제점
웹 애플리케이션을 개발하면서 공통 `User` 클래스를 상속받은 `AdminUser` 클래스를 구현할 때였다. 권한(role)을 나타내는 멤버 변수가 부모와 자식 모두에게 정의되어 있었는데, 자식 클래스에서 이 변수에 접근하면 자식의 변수만 참조되고 부모의 공통 속성은 가려지는 현상이 발생했다.

```java
class User {
    String role = "MEMBER";
}

class AdminUser extends User {
    String role = "ADMIN"; // 부모의 role을 가림(Shadowing)

    void showRole() {
        System.out.println("나의 권한: " + this.role);     // ADMIN
        System.out.println("기본 권한: " + super.role); // MEMBER
    }
}
```

이때 `super.role`을 통해 부모의 영역에 접근할 수 있다는 것을 알게 되었다. 마치 부모님의 성함을 직접 불러서 필요한 것을 요청하는 것과 같았다.

---

## 2. super(): "나를 낳아주신 부모님부터"

`super()`는 **부모 클래스의 생성자**를 호출하는 메서드다. 

자바에서 자식 객체를 생성할 때, 힙(Heap) 메모리에는 자식 객체뿐만 아니라 부모 객체의 영역도 함께 생성된다. 이때 부모 객체의 멤버들을 초기화하기 위해 부모의 생성자가 반드시 먼저 실행되어야 한다.

### 중요한 약속들
1. **첫 줄의 원칙**: `super()`는 자식 생성자의 **반드시 첫 번째 줄**에 위치해야 한다. 부모가 먼저 초기화되어야 자식이 그 기반 위에서 작업을 시작할 수 있기 때문이다.
2. **자동 삽입**: 내가 생성자에 `super()`를 직접 쓰지 않아도, 컴파일러는 부모의 기본 생성자(`super()`)를 자동으로 넣어준다.
3. **인자 전달**: 부모 클래스에 기본 생성자가 없고 매개변수가 있는 생성자만 있다면, 자식은 반드시 `super(arg1, ...)`를 명시적으로 호출해 주어야 한다.

---

## 3. 코드로 직접 확인하기 (TypeScript 시뮬레이션)

Java의 이 동작 원리를 내가 익숙한 TypeScript를 통해 테스트 코드로 재현해 보았다. JavaScript/TypeScript의 클래스 시스템 역시 Java의 `super`와 매우 유사한 철학을 공유하고 있다.

```typescript
// test/java-super.test.ts 중 일부 발췌

class Parent {
  protected className: string = "Parent";

  constructor(public name: string) {}

  greet() {
    return `Hello, I am ${this.name} from ${this.className}`;
  }
}

class Child extends Parent {
  protected className: string = "Child"; // Shadowing

  constructor(parentName: string, name: string) {
    super(parentName); // 1. super()를 통한 부모 생성자 호출
    this.name = name;
  }

  greet() {
    // 2. super.greet()을 통한 부모 메서드 확장
    const parentGreeting = super.greet();
    return `${parentGreeting}, and also ${this.name} from ${this.className}`;
  }
}
```

이 코드를 통해 부모의 생성 로직이 먼저 수행되고, 부모의 메서드를 자식에서 확장해서 사용할 수 있음을 직접 확인할 수 있었다.

---

## 💡 마치며: 상속은 '확장'이지 '복사'가 아니다

그동안 나는 상속을 부모의 코드를 내 클래스로 단순히 '복사'해 오는 것이라 착각했었다. 하지만 `super`와 `super()`를 깊이 있게 들여다보며 깨달은 점은, 상속은 **부모라는 단단한 토대 위에 자식이라는 새로운 층을 쌓아 올리는 물리적인 구축 과정**이라는 것이다.

부모가 먼저 온전히 존재해야(`super()`) 자식이 그 위에서 활동할 수 있고, 자식의 그늘에 가려진 부모의 모습(`super`)도 언제든 다시 찾아낼 수 있다. 이 명확한 계층 구조를 이해하고 나니, 복잡한 클래스 설계를 마주해도 이전보다 훨씬 덜 당황하게 되었다. 

단순히 문법을 외우는 것을 넘어, 객체가 메모리에 쌓이는 순서와 그 관계를 고민해 보는 귀중한 시간이었다. 오늘 배운 이 단단한 기초가 앞으로 마주할 더 복잡한 객체 지향의 세계에서 든든한 등대가 되어줄 것이라 믿는다.
