---
published: true
type: 'qna'
level: 'junior'
title: "JavaScript 클로저는 무엇이고 어떻게 활용하나요?"
date: '2026-04-27'
categories: ['JavaScript', 'CS']
---

## 핵심 요약

**클로저(Closure)** = 함수 + 함수가 선언된 **렉시컬 환경(스코프)** 의 조합. 함수가 자신이 정의된 환경의 변수에 계속 접근할 수 있는 메커니즘.

JS 면접의 단골 질문이자, "왜 그렇게 동작하는지" 설명할 수 있어야 합니다.

## 기본 동작

```javascript
function makeCounter() {
  let count = 0;
  return function() { return ++count; };
}
const counter = makeCounter();
counter(); // 1
counter(); // 2
```

`makeCounter`가 끝나도 내부 함수가 `count`를 **계속 참조**하므로 GC 대상이 안 됨. 외부에서 `count`를 직접 접근 못함 → **데이터 은닉**.

## 스코프와 렉시컬 환경

- **스코프**: 변수 접근 가능 범위.
- **렉시컬 스코프**: 함수가 **선언된 위치**를 기준으로 스코프 결정. 호출 위치 무관.
- 클로저는 함수 + 그 시점의 렉시컬 환경을 가둠.

## 클로저의 활용

### 1. 데이터 캡슐화 (private)
```javascript
function createAccount(balance) {
  return {
    deposit: (n) => balance += n,
    getBalance: () => balance,
  };
}
```
balance는 외부에서 직접 접근 불가.

### 2. 함수 팩토리
```javascript
const multiply = (x) => (y) => x * y;
const double = multiply(2);
```

### 3. 콜백/이벤트 핸들러에 상태 전달
```javascript
buttons.forEach((btn, i) => {
  btn.onclick = () => console.log(i);
});
```

### 4. 메모이제이션
```javascript
function memoize(fn) {
  const cache = new Map();
  return (x) => cache.has(x) ? cache.get(x) : cache.set(x, fn(x)).get(x);
}
```

## 흔한 함정: var와 루프

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 3, 3, 3
}
```

`var`는 함수 스코프 → `i`가 공유. 클로저가 모두 같은 `i`를 봄.

해결: `let`(블록 스코프) 또는 IIFE.
```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 0, 1, 2
}
```

## 메모리 관점

- 클로저는 외부 변수에 대한 **참조를 유지** → GC가 회수 못 함.
- 큰 객체를 클로저에 가두면 **누수**. 이벤트 리스너 + DOM 참조 클로저가 흔한 누수 원인.
- 사용 끝나면 명시적 해제(이벤트 리스너 remove 등).

## 클로저와 this

클로저는 `this`를 가두지 않음(렉시컬 변수만 가둠). `this`는 호출 방식이 결정 → 화살표 함수는 `this`를 자기 스코프 위에서 빌려옴.

## 자주 헷갈리는 디테일

- 클로저는 **JS만의 개념이 아님**. Python, Swift, Rust 등 일급 함수 언어에 모두 존재.
- "클로저는 한 변수만 가둔다"는 잘못. **렉시컬 환경 전체**를 참조 — 다만 모던 엔진은 사용된 변수만 유지(escape analysis).
- 클로저는 **호출 시점이 아니라 선언 시점**의 스코프를 가둠.

## 면접 follow-up

- "var와 let의 차이?" → 함수 스코프 vs 블록 스코프, 호이스팅 동작 차이, TDZ.
- "클로저로 모듈 패턴 만드는 법?" → IIFE로 즉시 실행 + 반환 객체에 public API 노출.
- "클로저로 인한 메모리 누수 디버깅?" → Chrome DevTools 메모리 스냅샷에서 `Closure` 타입 추적, retainer 확인.
