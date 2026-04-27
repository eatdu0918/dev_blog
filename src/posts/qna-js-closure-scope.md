---
published: true
type: 'qna'
level: 'junior'
title: "JavaScript 클로저는 무엇이고 어떻게 활용하나요?"
date: '2026-04-27'
categories: ['JavaScript', 'CS']
---

## Q1. 클로저(Closure)가 무엇인가요?

**A.** **함수 + 함수가 선언된 렉시컬 환경(스코프)의 조합**입니다. 함수가 자신이 정의된 환경의 변수에 계속 접근할 수 있는 메커니즘.

```javascript
function makeCounter() {
  let count = 0;
  return function() { return ++count; };
}
const counter = makeCounter();
counter(); // 1
counter(); // 2
```

`makeCounter`가 끝나도 내부 함수가 `count`를 계속 참조하므로 GC 대상이 안 됩니다. 외부에서 `count`를 직접 접근 못 함 → **데이터 은닉**.

---

## Q2. 렉시컬 스코프란 무엇인가요?

**A.** 함수가 **선언된 위치**를 기준으로 스코프가 결정되는 규칙입니다. **호출 위치는 무관**.

```javascript
let x = 10;
function outer() {
  function inner() { console.log(x); }
  return inner;
}
const fn = outer();
{ let x = 20; fn(); } // 10 — 호출 시점이 아닌 선언 시점 스코프
```

클로저는 이 렉시컬 환경을 함께 가두는 메커니즘이라 같은 원리에 기반합니다.

---

## Q3. 클로저는 어디에 활용하나요?

**A.** 4가지 패턴이 자주 보입니다.

```javascript
// 1. 데이터 캡슐화 (private)
function createAccount(balance) {
  return {
    deposit: n => balance += n,
    getBalance: () => balance,
  };
}

// 2. 함수 팩토리 (커링)
const multiply = x => y => x * y;
const double = multiply(2);

// 3. 콜백에 상태 전달
buttons.forEach((btn, i) => { btn.onclick = () => console.log(i); });

// 4. 메모이제이션
const memoize = fn => {
  const cache = new Map();
  return x => cache.has(x) ? cache.get(x) : cache.set(x, fn(x)).get(x);
};
```

---

## Q4. var를 for 루프에 쓰면 왜 문제가 되나요?

**A.** **`var`는 함수 스코프**라 한 변수를 공유하기 때문입니다.

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 3, 3, 3
}
```

세 클로저가 모두 같은 `i`를 참조하고, setTimeout 실행 시점에는 `i`가 이미 3.

해결: **`let`(블록 스코프)** 또는 IIFE.
```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 0, 1, 2
}
```

`let`은 매 iteration마다 새 바인딩을 만들어 클로저가 각자 다른 `i`를 캡처합니다.

---

## Q5. 클로저가 메모리 누수의 원인이 되는 건 어떤 경우인가요?

**A.** 클로저는 외부 변수에 대한 **참조를 계속 유지**하므로 GC가 회수하지 못합니다.

흔한 누수 패턴:
- **이벤트 리스너 + DOM 참조**: 리스너가 컴포넌트 외부 변수를 가두면 컴포넌트 제거 후에도 살아있음.
- **큰 데이터를 캡처한 함수**를 어딘가에 등록하고 정리 안 함.
- **타이머 콜백**(setInterval)이 계속 살아있음.

해결: 사용 끝나면 명시적 해제(`removeEventListener`, `clearInterval`, ref 끊기).

---

## Q6. 클로저와 this는 어떤 관계인가요?

**A.** **클로저는 `this`를 가두지 않습니다**. 렉시컬 변수만 가둡니다.

`this`는 호출 방식에 따라 결정됩니다:
- 일반 함수: 호출 시 결정.
- 화살표 함수: **자기 스코프 위에서 `this`를 빌려옴**(렉시컬 this).

```javascript
class Counter {
  count = 0;
  // this를 렉시컬하게 받음
  tick = () => { this.count++; };
}
```

화살표 메서드를 이벤트 핸들러로 넘겨도 `this`가 안 사라지는 이유입니다.

---

## Q7. 클로저로 모듈 패턴은 어떻게 만드나요?

**A.** **IIFE(즉시 실행 함수)** 로 비공개 변수를 가두고 public API만 반환.

```javascript
const counter = (() => {
  let count = 0;
  return {
    inc: () => ++count,
    get: () => count,
  };
})();

counter.inc(); counter.inc(); counter.get(); // 2
counter.count; // undefined — 직접 접근 불가
```

ES Module 도입 전까지 자바스크립트의 표준 모듈 패턴이었습니다.

---

## Q8. 클로저로 인한 메모리 누수는 어떻게 디버깅하나요?

**A.** **Chrome DevTools 메모리 스냅샷**으로 추적합니다.

1. 시간 차이 두고 두 번 스냅샷.
2. "Comparison" 모드로 늘어난 객체 확인.
3. 객체 타입 중 `Closure`나 의심 객체의 **retainer** 추적.
4. 어떤 클로저가 잡고 있는지 확인하고 해제 로직 추가.

`performance.memory.usedJSHeapSize`로 추세를 모니터링하다가 의심 시점에 스냅샷을 뜨는 흐름이 일반적입니다.

---

## Q9. 클로저는 JS만의 개념인가요?

**A.** 아닙니다. **일급 함수를 가진 거의 모든 언어**에 클로저가 있습니다.

- Python, Swift, Rust, Kotlin, Go, C# 등.
- Java도 람다 + effectively final 변수로 클로저 지원(엄격하진 않음).
- 차이는 **변수 캡처 방식**. JS/Python은 참조 캡처, Rust는 명시적(`move`), Java는 effectively final 강제.

언어별 차이를 이해하면 클로저 사용 시 메모리/스레드 안전성 판단이 달라집니다.
