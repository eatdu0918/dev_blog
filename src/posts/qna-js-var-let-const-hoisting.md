---
published: true
type: 'qna'
level: 'junior'
title: "var, let, const의 차이와 호이스팅을 설명해 주세요"
date: '2026-04-27'
categories: ['JavaScript', 'CS']
---

## Q1. var, let, const의 차이를 정리해 주세요.

**A.** 5가지 축에서 다릅니다.

| | var | let | const |
|---|---|---|---|
| 스코프 | 함수 | 블록 | 블록 |
| 재선언 | 가능 | 불가 | 불가 |
| 재할당 | 가능 | 가능 | 불가 |
| 호이스팅 | undefined로 초기화 | TDZ | TDZ |
| 전역 객체 속성 | 됨 | 안 됨 | 안 됨 |

현대 코딩 가이드: **기본 `const`, 재할당 필요할 때만 `let`, `var`는 안 씀**.

---

## Q2. 호이스팅이 정확히 무엇인가요?

**A.** "선언이 위로 끌려간다"는 비유지만, 정확히는 **JS 엔진이 실행 전 변수/함수 선언을 먼저 메모리에 등록**하는 것입니다.

```javascript
console.log(x); // undefined (TypeError 아님)
var x = 1;
```

엔진이 본 모습:
```javascript
var x; // 선언 + undefined로 초기화
console.log(x);
x = 1;
```

---

## Q3. let/const도 호이스팅되나요?

**A.** **됩니다**. 다만 **TDZ(Temporal Dead Zone)** 라는 차이가 있습니다.

```javascript
console.log(y); // ReferenceError
let y = 1;
```

호이스팅은 일어나지만 **초기화가 선언 라인까지 미뤄집니다**. 그 전 구간이 TDZ. var와 달리 ReferenceError가 발생해 사용 전 선언을 강제합니다.

TDZ 안에서는 `typeof`도 ReferenceError를 던집니다(ES6 이전엔 안전했지만 표준화됨).

---

## Q4. var의 함수 스코프가 왜 문제가 되나요?

**A.** **블록을 무시**하기 때문에 의도치 않은 변수 누수가 발생합니다.

```javascript
function f() {
  if (true) { var x = 1; }
  console.log(x); // 1 — 블록 밖에서도 접근
}
```

특히 for 루프와 클로저 조합에서 단골 함정:
```javascript
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3,3,3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0,1,2
```

`let`은 매 iteration마다 새 바인딩을 만들어 클로저가 각각 다른 값을 캡처합니다.

---

## Q5. const는 불변을 보장하나요?

**A.** **아닙니다**. 재할당만 금지하고 객체 내부 변경은 가능합니다.

```javascript
const arr = [];
arr.push(1);   // OK — 내용 변경 가능
arr = [];      // TypeError — 재할당 금지
```

진짜 불변이 필요하면:
- `Object.freeze(obj)`: **얕은** 동결.
- Immer, Immutable.js 같은 라이브러리.
- TypeScript `readonly` 키워드(타입 레벨 보호).

---

## Q6. 함수 선언과 함수 표현식의 호이스팅 차이는?

**A.** **함수 선언은 바디까지**, **함수 표현식은 변수만** 호이스팅됩니다.

```javascript
greet(); // 'hi' — 함수 선언은 통째로 호이스팅
function greet() { console.log('hi'); }

hi(); // TypeError — var hi가 undefined인 상태에서 호출
var hi = function() { console.log('hi'); };
```

이 차이로 함수 선언은 어디서나 호출 가능하고, 함수 표현식은 할당 이후에만 호출 가능합니다.

---

## Q7. let/const는 전역에서 선언해도 window 속성이 안 되나요?

**A.** 네. **let/const는 전역에서 선언해도 `window`/`global` 객체의 속성이 되지 않습니다**.

```javascript
var a = 1;
let b = 2;
console.log(window.a); // 1
console.log(window.b); // undefined
```

`var` 시대의 전역 오염 문제를 피하기 위한 의도적 설계입니다. 모듈 시스템이 표준화되면서 전역 스코프 자체를 거의 안 쓰는 방향으로 갔습니다.

---

## Q8. TDZ가 왜 도입됐나요?

**A.** **사용 전 선언을 강제해 버그를 줄이기** 위해서입니다.

`var` 시대의 함정:
```javascript
console.log(x); // undefined — 실수인지 의도인지 알 수 없음
var x = 1;
```

`let`/`const`로 짠 같은 코드는 ReferenceError를 던져 즉시 문제가 드러납니다. "선언 위치"가 항상 사용 위치보다 위에 있도록 강제해 코드 가독성도 좋아집니다.

---

## Q9. 같은 블록에서 같은 이름을 두 번 선언하면 어떻게 되나요?

**A.** **`let`/`const`는 SyntaxError, `var`는 가능**합니다.

```javascript
let a = 1; let a = 2; // SyntaxError
var b = 1; var b = 2; // OK, b === 2
```

`var`의 재선언 허용은 코드를 큰 파일에 모아 짤 때 충돌 방지가 어려운 원인이 됐습니다. `let`/`const`는 **이름 충돌을 컴파일 시점에 잡아주는** 안전성을 줍니다.
