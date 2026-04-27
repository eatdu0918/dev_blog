---
published: true
type: 'qna'
level: 'junior'
title: "Promise와 async/await는 어떻게 동작하나요?"
date: '2026-04-27'
categories: ['JavaScript', 'Async']
---

## Q1. Promise는 무엇이고 어떤 상태를 가지나요?

**A.** **비동기 작업의 최종 결과(성공/실패)를 표현하는 객체**입니다. 3가지 상태가 있습니다.

- `pending`: 진행 중.
- `fulfilled`: 성공.
- `rejected`: 실패.

상태는 **한 번 변경되면 다시 바뀌지 않습니다**(불변).

```javascript
const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve('ok'), 100);
});

p.then(v => console.log(v))
 .catch(e => console.error(e))
 .finally(() => console.log('done'));
```

---

## Q2. async/await는 Promise와 어떻게 다른가요?

**A.** **syntactic sugar**입니다. 동기 코드처럼 보이게 쓰지만 내부는 여전히 Promise입니다.

```javascript
async function fetchUser() {
  try {
    const res = await fetch('/api/user');
    return await res.json();
  } catch (e) {
    console.error(e);
  }
}
```

- `async` 함수는 항상 Promise 반환.
- `await`는 Promise를 풀어 값 반환, reject면 throw.
- try/catch로 에러 처리 가능 → 가독성 큰 향상.

---

## Q3. Promise.resolve().then()이 setTimeout(fn, 0)보다 먼저 실행되는 이유는?

**A.** **마이크로태스크 큐가 매크로태스크보다 우선**이기 때문입니다.

```javascript
console.log(1);
setTimeout(() => console.log(2), 0);  // 매크로태스크
Promise.resolve().then(() => console.log(3));  // 마이크로태스크
console.log(4);
// 1, 4, 3, 2
```

이벤트 루프 한 턴 안에서 마이크로태스크 큐를 **모두 비워야** 다음 매크로태스크로 넘어갑니다. Promise는 마이크로태스크라 항상 먼저 처리됩니다.

---

## Q4. Promise.all과 allSettled, race, any의 차이는?

**A.** 4가지 조합 함수가 있습니다.

- **`Promise.all([p1, p2])`**: 모두 fulfilled면 결과 배열. 하나라도 reject면 즉시 reject.
- **`Promise.allSettled`**: 모두 끝날 때까지 대기. 각 결과를 `{status, value/reason}` 배열로.
- **`Promise.race`**: 가장 먼저 끝나는 것의 결과.
- **`Promise.any`**: 가장 먼저 fulfilled 되는 것. 모두 reject면 `AggregateError`.

선택 기준: 부분 실패 허용 여부. 한 건 실패 시 전체 중단 = `all`, 결과를 모두 모으는 게 우선 = `allSettled`.

---

## Q5. 병렬 처리할 수 있는 fetch를 순차로 실행하는 실수가 자주 발생합니다.

**A.** `await`를 의도 없이 줄줄이 쓰면 발생합니다.

```javascript
// ❌ 순차 — 느림
const a = await fetchA();
const b = await fetchB();

// ✅ 병렬 — 빠름 (서로 의존 없을 때)
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

`async/await`의 동기처럼 보이는 가독성 때문에 의도치 않은 순차 처리가 흔히 나옵니다. 두 fetch가 서로 결과에 의존하지 않으면 거의 항상 `Promise.all`이 정답입니다.

---

## Q6. forEach 안에서 async를 쓰면 안 되는 이유는?

**A.** **`forEach`는 반환된 Promise를 무시**해서 await가 의도대로 동작하지 않습니다.

```javascript
// ❌ forEach는 Promise 무시
items.forEach(async (item) => {
  await process(item);
});
console.log('done'); // 처리 끝나기 전에 실행

// ✅ 순차 처리
for (const item of items) {
  await process(item);
}

// ✅ 병렬 처리
await Promise.all(items.map(item => process(item)));
```

순차냐 병렬이냐를 명확히 결정하고 그에 맞는 도구를 선택합니다.

---

## Q7. Promise 안에서 동기 throw하면 어떻게 되나요?

**A.** **자동으로 reject로 변환**됩니다. 그래서 `.catch`로 잡을 수 있습니다.

```javascript
const p = new Promise((resolve, reject) => {
  throw new Error('boom'); // 자동으로 reject
});

p.catch(e => console.error(e.message)); // 'boom'
```

마찬가지로 `then` 콜백 안에서 throw하면 다음 catch로 흐름이 갑니다. 동기 코드의 throw와 달리 비동기 chain의 일부로 통합됩니다.

---

## Q8. async/await는 내부적으로 어떻게 동작하나요?

**A.** **`await` 지점에서 함수를 일시 정지** → 이벤트 루프가 다른 일 처리 → Promise 해결되면 **마이크로태스크로 재개**.

내부 구현은 **generator + Promise** 조합과 거의 동등합니다. 그래서 `function*` + `yield`로 같은 패턴을 만들 수 있습니다.

스택 추적이 끊기는 문제는 모던 엔진의 **async stack trace** 기능으로 개선됐습니다. Chrome DevTools에서 await 경계 너머의 호출 스택을 추적할 수 있습니다.

---

## Q9. Unhandled Promise Rejection은 무엇이 문제인가요?

**A.** **catch 안 한 reject**가 운영 환경에서 조용한 사고를 만듭니다.

```javascript
async function task() { throw new Error('oops'); }
task(); // 어디서도 catch 안 함 → Unhandled Rejection
```

Node.js는 미래에 프로세스 종료(`--unhandled-rejections=strict`)로 갈 예정이고, 브라우저는 `unhandledrejection` 이벤트로 모니터링 가능합니다.

운영 권장:
- 모든 비동기 진입점에 try/catch 또는 `.catch`.
- 글로벌 핸들러로 미처 잡지 못한 rejection을 로깅 + 알람.
