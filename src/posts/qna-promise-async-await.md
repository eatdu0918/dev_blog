---
published: true
type: 'qna'
level: 'junior'
title: "Promise와 async/await는 어떻게 동작하나요?"
date: '2026-04-27'
categories: ['JavaScript', 'Async']
---

## 핵심 요약

- **Promise**: 비동기 작업의 최종 결과(성공/실패)를 표현하는 객체. 3가지 상태: `pending → fulfilled / rejected`.
- **async/await**: Promise의 syntactic sugar. **Promise를 동기처럼 보이게** 작성하지만 실행은 여전히 비동기.

## Promise 기본

```javascript
const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve('ok'), 100);
});

p.then(v => console.log(v))
 .catch(e => console.error(e))
 .finally(() => console.log('done'));
```

상태는 한 번 fulfilled/rejected되면 변경 불가.

## async/await로 변환

```javascript
async function fetchUser() {
  try {
    const res = await fetch('/api/user');
    const json = await res.json();
    return json;
  } catch (e) {
    console.error(e);
  }
}
```

- `async` 함수는 항상 Promise 반환.
- `await`는 Promise를 풀어 값 반환. reject면 throw.
- try/catch로 에러 처리 가능.

## 마이크로태스크 큐

면접 단골. **Promise 콜백은 마이크로태스크**, `setTimeout`은 매크로태스크 → 마이크로태스크가 먼저.

```javascript
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);
// 출력: 1, 4, 3, 2
```

이벤트 루프 한 턴 안에서 마이크로태스크 큐는 **모두 비워질 때까지** 처리. 그 다음 매크로태스크 1개.

## Promise 조합

- **`Promise.all([p1, p2])`**: 모두 fulfilled면 결과 배열, 하나라도 reject면 즉시 reject.
- **`Promise.allSettled`**: 모두 끝날 때까지 대기, 결과 배열에 fulfilled/rejected 모두.
- **`Promise.race`**: 가장 먼저 끝나는 것의 결과.
- **`Promise.any`**: 가장 먼저 fulfilled 되는 것. 모두 reject면 AggregateError.

## 병렬 vs 순차

```javascript
// 순차 — 느림
const a = await fetchA();
const b = await fetchB();

// 병렬 — 빠름 (서로 의존 없을 때)
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

`async/await` 가독성 때문에 의도치 않은 순차 처리가 자주 발생 → 면접에서 자주 짚는 포인트.

## 에러 처리 패턴

```javascript
// catch 위치 주의
try {
  const data = await fetchData(); // 여기 throw
} catch (e) {
  // 잡힘
}

// Promise.all은 첫 reject만 잡음
try {
  await Promise.all([failingP1, failingP2]);
} catch (e) {
  // 첫 번째 에러만
}
```

## 흔한 함정

- **forEach + async**: `forEach`는 Promise 무시. 순차 실행 원하면 `for...of`, 병렬은 `Promise.all + map`.
- **Promise 미반환**: `async` 함수에서 await 안 하고 끝나면 호출자가 완료 못 기다림.
- **에러 swallow**: catch 안 하면 Unhandled Rejection. 운영에서 메모리 누수/조용한 실패.
- **Promise 안의 동기 throw**: 자동으로 reject로 변환 — 그래서 catch 가능.

## async/await의 내부

엔진은 `await` 지점에서 함수를 일시 정지(generator + Promise) → 이벤트 루프가 다른 일 처리 → Promise 해결되면 마이크로태스크로 재개.

스택 추적이 끊기는 문제는 모던 엔진의 async stack trace로 개선됨.

## 자주 헷갈리는 디테일

- `Promise.resolve(p)`에 Promise를 넘기면 그 Promise를 반환(중첩 X).
- `then` 안에서 throw 하면 다음 catch로 흐름. 일반 함수의 throw와 다름.
- `await` 없이 async 함수를 호출하면 Promise만 받음 — fire-and-forget. 의도면 OK, 실수면 위험.

## 면접 follow-up

- "Promise.all과 allSettled 선택 기준?" → 부분 실패 허용 여부. 한 건 실패 시 전체 중단이면 all, 결과 모으는 게 우선이면 allSettled.
- "이벤트 루프에서 Promise는 왜 setTimeout보다 빠른가?" → 마이크로태스크 큐 우선. 한 턴 안에서 모두 비워짐.
- "콜백 지옥을 Promise로 풀고도 if/else가 깊으면?" → async/await + early return + 작은 함수로 평탄화.
