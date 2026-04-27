---
published: true
type: 'qna'
level: 'junior'
title: "JavaScript의 this는 어떻게 결정되나요? 4가지 바인딩 규칙"
date: '2026-04-27'
categories: ['JavaScript', 'CS']
---

## Q1. JavaScript의 this는 무엇으로 결정되나요?

**A.** **호출 방식**입니다. 함수가 정의된 위치나 스코프와 무관합니다.

4가지 규칙(우선순위 높은 순):
1. **`new` 바인딩**: 새 객체.
2. **명시적 바인딩**: `call/apply/bind`로 지정.
3. **암시적 바인딩**: `obj.fn()` → `obj`.
4. **기본 바인딩**: 위 셋이 아니면 strict는 `undefined`, 아니면 전역.

화살표 함수는 별개로 `this`를 **렉시컬하게 상속**합니다.

---

## Q2. new 바인딩은 어떻게 동작하나요?

**A.** 4단계로 일어납니다.

```javascript
function Person(name) { this.name = name; }
const p = new Person('kim');
```

1. 새 객체 생성.
2. 함수의 `this`를 새 객체로 바인딩.
3. 새 객체의 `__proto__`를 함수의 `prototype`에 연결.
4. 함수가 객체를 명시적으로 return하지 않으면 새 객체 반환.

`new`로 호출하면 다른 모든 바인딩 규칙을 이깁니다.

---

## Q3. call, apply, bind의 차이는요?

**A.** 모두 명시적 바인딩이지만 사용 방식이 다릅니다.

```javascript
function greet() { return this.name; }

greet.call({ name: 'lee' });        // 'lee' — 즉시 호출, 인자 나열
greet.apply({ name: 'lee' });       // 'lee' — 즉시 호출, 인자 배열
const bound = greet.bind({ name: 'park' });
bound();                            // 'park' — 새 함수 반환
```

- `call/apply`는 즉시 호출.
- `bind`는 새 함수를 반환.
- **`bind`는 한 번 묶이면 변경 불가**. 다시 bind해도 첫 바인딩이 유지됩니다.

---

## Q4. 메서드를 변수에 할당하면 왜 this를 잃나요?

**A.** 호출 방식이 `obj.fn()`에서 단순 함수 호출로 바뀌기 때문입니다.

```javascript
const obj = { name: 'kim', greet() { return this.name; } };

obj.greet();           // 'kim' — 암시적 바인딩
const fn = obj.greet;
fn();                  // undefined — 기본 바인딩 (strict)
```

콜백으로 넘길 때 자주 발생합니다:
```javascript
setTimeout(obj.greet, 0);              // this 잃음
setTimeout(obj.greet.bind(obj), 0);    // 해결
setTimeout(() => obj.greet(), 0);      // 화살표로 감쌈
```

---

## Q5. 화살표 함수의 this는 어떻게 결정되나요?

**A.** **자체 `this`가 없어서 둘러싼 스코프의 `this`를 빌려옵니다**(렉시컬 this).

```javascript
const obj = {
  name: 'kim',
  greet: () => this.name,  // ❌ obj가 아님 — 둘러싼 스코프의 this
};
```

객체 메서드로는 부적합합니다. 좋은 사용처는 **이벤트 핸들러나 콜백을 클래스 메서드로 만드는 것**:
```javascript
class Counter {
  count = 0;
  tick = () => { this.count++; }; // 어디로 넘겨도 this 유지
}
```

---

## Q6. 클래스 메서드를 변수에 할당했더니 TypeError가 났습니다. 왜죠?

**A.** **클래스 메서드는 strict 모드**라 `this`가 `undefined`가 되면 즉시 에러가 납니다.

```javascript
class Btn { constructor() { this.x = 1; } handle() { console.log(this.x); } }
const b = new Btn();
const f = b.handle;
f(); // TypeError: Cannot read property 'x' of undefined
```

해결:
- 생성자에서 bind: `this.handle = this.handle.bind(this);`
- 화살표 메서드: `handle = () => { console.log(this.x); };`

React 클래스 컴포넌트에서 `this.handleClick.bind(this)` 패턴이 이 이유였습니다.

---

## Q7. bind 후 다시 bind하면 어떻게 되나요?

**A.** **첫 바인딩이 유지**됩니다. 두 번째 bind는 무시됩니다.

```javascript
function fn() { return this.x; }
const b1 = fn.bind({ x: 1 });
const b2 = b1.bind({ x: 2 });
b2(); // 1 — 첫 bind가 이김
```

다만 `new b1()`처럼 `new`를 쓰면 바인딩이 무시되고 새 객체가 `this`가 됩니다(new가 가장 우선).

---

## Q8. React에서 화살표 메서드와 constructor bind는 어떻게 다른가요?

**A.** 동작은 같지만 **메모리 사용이 다릅니다**.

- **화살표 메서드**(`handler = () => {}`): 인스턴스마다 새 함수 생성. 클래스 인스턴스가 많으면 메모리 부담.
- **constructor bind**: 한 번만 bind된 함수가 프로토타입에 — 메모리 효율.

성능 차이는 보통 무시 가능한 수준이라 가독성 좋은 화살표 메서드가 흔히 쓰입니다. 매우 많은 인스턴스를 만드는 컴포넌트라면 prototype 메서드 + bind를 고려할 수 있습니다.

---

## Q9. DOM 이벤트 리스너 안의 this는 무엇인가요?

**A.** **이벤트가 발생한 DOM 요소**입니다(`addEventListener` 기준).

```javascript
button.addEventListener('click', function() {
  console.log(this); // 클릭된 button 요소
});

button.addEventListener('click', () => {
  console.log(this); // 화살표는 둘러싼 스코프의 this
});
```

`event.currentTarget`과 같은 값입니다. 화살표 함수를 쓰면 이 동작을 잃으니 둘 사이의 의도를 분명히 해야 합니다.
