---
published: true
type: 'qna'
level: 'mid'
title: "함수형 프로그래밍의 핵심 개념을 설명해 주세요"
date: '2026-04-27'
categories: ['CS', 'Programming']
---

## 핵심 요약

함수형 프로그래밍은 **데이터를 변경하지 않고 변환하는 패러다임**.

핵심 개념:
1. **순수 함수(Pure Function)**: 같은 입력 → 같은 출력 + 부수효과 없음.
2. **불변성(Immutability)**: 데이터를 바꾸지 않고 새 데이터 생성.
3. **일급 함수(First-class Function)**: 함수가 값처럼 전달/반환.
4. **고차 함수(Higher-order Function)**: 함수를 인자로 받거나 반환.
5. **선언형(Declarative)**: 무엇을 할지(what), 어떻게(how)는 추상.

## 순수 함수

```javascript
// 순수
const add = (a, b) => a + b;

// 불순 — 외부 상태에 의존
let counter = 0;
const tick = () => ++counter;
```

장점:
- 테스트 쉬움(독립 실행).
- 캐싱(메모이제이션) 가능.
- 병렬 안전(공유 상태 X).
- 추론 쉬움.

## 불변성

```javascript
// 변경 — 부수효과
const arr = [1, 2, 3];
arr.push(4);

// 불변
const arr2 = [...arr, 4]; // 새 배열
```

JS 라이브러리: Immer, Immutable.js. React에서 상태 업데이트는 항상 새 객체 — 변경 감지가 참조 비교 기반.

## 고차 함수

```javascript
const map = (arr, fn) => arr.map(fn);
const filter = (arr, pred) => arr.filter(pred);
const reduce = (arr, fn, init) => arr.reduce(fn, init);

// 함수 합성
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
const addOneAndDouble = compose(x => x * 2, x => x + 1);
```

## 커링 / 부분 적용

```javascript
const curry = f => a => b => f(a, b);
const add = curry((a, b) => a + b);
const inc = add(1);
inc(5); // 6
```

부분 적용은 **재사용 가능한 작은 함수** 생성에 유용.

## 함수 합성

```javascript
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
const process = pipe(
  trim,
  toLowerCase,
  removeHyphens,
);
```

OOP의 상속/합성 대신 **함수 합성**으로 동작 조립.

## 함수형 vs 명령형

```javascript
// 명령형
let total = 0;
for (let i = 0; i < items.length; i++) {
  if (items[i].active) total += items[i].price;
}

// 함수형
const total = items
  .filter(i => i.active)
  .reduce((sum, i) => sum + i.price, 0);
```

함수형 코드는 **무엇을** 하는지가 명확. 명령형은 **어떻게** 하는지 단계가 보임.

## 모나드 (간단히)

값을 컨텍스트로 감싸 합성을 안전하게 만드는 추상.

- **Maybe/Optional**: null 처리. `Optional.of(x).map(...)`.
- **Either/Result**: 성공/실패. Rust의 `Result`.
- **Promise**: 비동기. JS의 thenable이 사실상 모나드.

이름을 외울 필요는 없고, **null/예외/비동기를 chain으로 합성**한다는 사고가 핵심.

## React/현대 JS에서의 함수형 영향

- 컴포넌트 = 함수.
- props는 불변, 새 객체로 업데이트.
- `useMemo`, `useCallback` = 메모이제이션.
- Redux의 reducer = 순수 함수.
- map/filter/reduce가 일상.

## 부수효과를 어떻게?

순수 함수만으로는 IO 못함. 함수형 언어/스타일은:
- IO를 **가장자리(edge)** 로 밀고 핵심 로직은 순수 유지.
- React: 컴포넌트는 함수, useEffect로 부수효과 격리.
- Haskell: IO 모나드로 효과를 타입에 표현.

## 자주 헷갈리는 디테일

- 함수형 = 재귀가 아님. 재귀는 도구일 뿐.
- "for 안 쓰고 map 쓰면 함수형" 단순화. 핵심은 순수성/불변성.
- 성능: map/filter 체이닝은 중간 배열 생성 → 큰 데이터셋엔 transducer 또는 reduce로 한 번에.

## 면접 follow-up

- "OOP와 FP 중 어느 것이 더 좋은가?" → 도구의 선택. 도메인 모델링은 OOP, 데이터 변환은 FP가 자연스러움. 한 코드베이스에서 혼용 일반적.
- "불변성의 성능 비용?" → 새 객체 생성 비용. 구조 공유(persistent data structure)로 완화. Immer는 proxy로 구현.
- "함수형의 한계?" → 부수효과가 본질인 도메인(렌더링, IO, 게임 상태)에선 순수 유지가 역효과.
