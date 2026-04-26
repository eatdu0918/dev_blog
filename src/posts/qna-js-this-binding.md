---
published: true
type: 'qna'
level: 'junior'
title: "JavaScript의 this는 어떻게 결정되나요? 4가지 바인딩 규칙"
date: '2026-04-27'
categories: ['JavaScript', 'CS']
---

## 핵심 요약

JS의 `this`는 **호출 방식**으로 결정됩니다. 함수가 정의된 위치나 스코프와 무관.

4가지 규칙(우선순위 높은 순):
1. **`new` 바인딩**: `new Foo()` → 새 객체.
2. **명시적 바인딩**: `fn.call/apply/bind` → 지정 객체.
3. **암시적 바인딩**: `obj.fn()` → `obj`.
4. **기본 바인딩**: 위 셋이 아님 → strict면 `undefined`, 아니면 전역(window/global).

화살표 함수는 별개 — `this`를 **렉시컬하게 상속**.

## 1. new 바인딩

```javascript
function Person(name) { this.name = name; }
const p = new Person('kim'); // this = 새 객체
```

`new`는 새 객체 생성 → 함수의 this 바인딩 → 프로토타입 연결 → return이 객체 아니면 새 객체 반환.

## 2. 명시적 바인딩

```javascript
function greet() { return this.name; }
greet.call({ name: 'lee' });   // 'lee'
greet.apply({ name: 'lee' });  // 'lee' (인자 배열)
const bound = greet.bind({ name: 'park' });
bound(); // 'park'
```

`bind`는 한 번 묶이면 변경 불가. `bind`된 함수에 다시 `bind`해도 첫 바인딩 유지.

## 3. 암시적 바인딩

```javascript
const obj = {
  name: 'kim',
  greet() { return this.name; }
};
obj.greet(); // 'kim'
```

함정: **분리하면 잃음**.
```javascript
const fn = obj.greet;
fn(); // undefined (strict) — this가 obj가 아님
```

콜백으로 넘길 때 자주 발생.
```javascript
setTimeout(obj.greet, 0); // this 바인딩 잃음
setTimeout(obj.greet.bind(obj), 0); // 해결
setTimeout(() => obj.greet(), 0); // 화살표로 감쌈
```

## 4. 기본 바인딩

```javascript
function loose() { return this; }
loose(); // 비strict: window/global, strict: undefined
```

## 화살표 함수

```javascript
const obj = {
  name: 'kim',
  greet: () => this.name, // ❌ obj가 아님
};
```

화살표 함수는 자체 `this`가 없음 → 둘러싼 스코프의 `this`. 메서드로는 부적합.

좋은 사용:
```javascript
class Counter {
  count = 0;
  tick = () => { this.count++; }; // 이벤트 핸들러로 넘겨도 안전
}
```

## class와 this

```javascript
class Btn {
  constructor() { this.x = 1; }
  handle() { console.log(this.x); }
}
const b = new Btn();
const f = b.handle;
f(); // TypeError — this가 undefined
```

클래스 메서드는 strict 모드 → 분리 시 `undefined`. 해결: bind, 화살표 메서드, 렌더 시점 바인딩.

React 클래스 컴포넌트의 `this.handleClick = this.handleClick.bind(this)` 패턴이 이 이유.

## 우선순위 정리

```
new > bind > call/apply > obj.fn() > 기본
```

`bind`된 함수에 `new`를 쓰면 new가 이김(바인딩 무시).

## 자주 헷갈리는 디테일

- `setTimeout(obj.fn, 0)`은 함수 참조만 넘김 → this 잃음.
- DOM 이벤트 리스너 안의 `this`는 이벤트가 발생한 요소(addEventListener 기준).
- `Function.prototype.toString()`처럼 직접 호출하면 기본 바인딩.

## 면접 follow-up

- "화살표 함수가 메서드로 부적합한 이유?" → 객체의 this를 못 받음. 렉시컬 스코프의 this 사용.
- "bind 후 다시 bind 하면?" → 두 번째 bind는 무시. 첫 바인딩 유지.
- "React에서 화살표 메서드 vs constructor bind 차이?" → 화살표는 인스턴스마다 새 함수 생성(메모리). bind는 한 번. 성능 차이는 보통 무시 가능.
