---
published: true
type: 'qna'
level: 'junior'
title: "var, let, const의 차이와 호이스팅을 설명해 주세요"
date: '2026-04-27'
categories: ['JavaScript', 'CS']
---

## 핵심 요약

| | var | let | const |
|---|---|---|---|
| 스코프 | 함수 | 블록 | 블록 |
| 재선언 | 가능 | 불가 | 불가 |
| 재할당 | 가능 | 가능 | 불가 |
| 호이스팅 | undefined로 초기화 | TDZ | TDZ |
| 전역 객체 속성 | 됨 | 안 됨 | 안 됨 |

신입 면접에서 거의 무조건 나옵니다.

## 호이스팅의 정확한 정의

"선언이 위로 끌려간다"는 비유적 설명. 정확히는 JS 엔진이 **실행 전 변수/함수 선언을 먼저 메모리에 등록**.

```javascript
console.log(x); // undefined (TypeError 아님)
var x = 1;
```

호이스팅 후:
```javascript
var x; // 선언 + undefined로 초기화
console.log(x);
x = 1;
```

## let/const의 호이스팅과 TDZ

`let`/`const`도 호이스팅됨. 다만 **선언 라인 전에 접근하면 ReferenceError** — Temporal Dead Zone.

```javascript
console.log(y); // ReferenceError
let y = 1;
```

호이스팅 자체는 일어나지만 초기화가 선언 라인까지 미뤄지므로 그 전엔 사용 불가.

## var의 함수 스코프 함정

```javascript
function f() {
  if (true) { var x = 1; }
  console.log(x); // 1 — 블록 밖에서도 접근
}
```

블록을 무시하므로 의도치 않은 변수 누수. `let`/`const`로 해결.

루프와 클로저:
```javascript
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3,3,3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0,1,2
```

## const의 의미

**재할당** 금지지 **불변** 보장이 아님.

```javascript
const arr = [];
arr.push(1); // OK — 객체 내부는 변경 가능
arr = [];    // TypeError
```

진짜 불변이 필요하면 `Object.freeze`(얕은) 또는 라이브러리(Immer, Immutable.js).

## 함수 호이스팅

```javascript
greet(); // 'hi' — 함수 선언은 통째로 호이스팅
function greet() { console.log('hi'); }

hi(); // TypeError — 변수만 호이스팅, undefined를 호출
var hi = function() { console.log('hi'); };
```

함수 선언과 함수 표현식의 차이가 면접 단골.

## 어떤 걸 쓸까

현대 코딩 가이드:
- 기본 `const`.
- 재할당이 필요할 때만 `let`.
- `var`는 거의 사용 X(레거시 호환 외).

## 자주 헷갈리는 디테일

- `let`/`const`도 **전역 스코프에서 선언**해도 `window`/`global` 속성으로 등록되지 않음.
- 같은 블록에서 `let`/`const`를 두 번 선언하면 SyntaxError(`var`는 가능).
- TDZ 안에서 `typeof`도 ReferenceError(예전엔 안전했지만 ES6 이후 던짐).

## 면접 follow-up

- "TDZ가 왜 도입됐나?" → 사용 전 선언 강제로 버그 감소. var의 undefined 함정 회피.
- "함수 선언과 표현식의 호이스팅 차이?" → 함수 선언은 바디까지, 함수 표현식은 변수만(undefined).
- "for-let의 매 반복마다 새 바인딩?" → 매 iteration마다 새 i 바인딩. 그래서 클로저 안에서 각각 다른 값 캡처.
