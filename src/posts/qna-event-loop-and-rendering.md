---
published: true
type: 'qna'
level: 'mid'
title: "JavaScript 이벤트 루프와 브라우저 렌더링 파이프라인의 관계를 설명해주세요. 마이크로태스크와 매크로태스크는 어떻게 다른가요?"
date: '2026-04-26'
categories: ['JavaScript', 'Browser', 'Performance']
---

## Q1. 이벤트 루프 한 사이클은 어떻게 진행되나요?

**A.** 3단계가 반복됩니다.

1. **매크로태스크 큐에서 1개를 꺼내 실행** (setTimeout, I/O, MessageChannel).
2. 그 태스크가 끝나면 **마이크로태스크 큐를 모두 비움** (Promise then/catch/finally, `queueMicrotask`, MutationObserver).
3. 필요하면 **렌더링 단계**(style → layout → paint → composite). 60fps라면 약 16.6ms마다 한 번 기회.

핵심은 **마이크로태스크는 한 매크로태스크 안에서 모두 비워야 다음으로 넘어간다**는 점입니다.

---

## Q2. setTimeout(fn, 0)과 Promise.resolve().then(fn)의 실행 순서가 다른 이유는?

**A.** 두 콜백이 서로 다른 큐에 들어갑니다.

```javascript
console.log('start');
setTimeout(() => console.log('macro'), 0);
Promise.resolve().then(() => console.log('micro'));
console.log('end');
// start → end → micro → macro
```

매크로태스크 1개가 끝날 때마다 마이크로태스크 큐를 모두 비우고 넘어가므로, **마이크로태스크가 항상 먼저** 실행됩니다.

---

## Q3. Promise chain을 무한히 걸면 화면이 멈추는 이유는?

**A.** 마이크로태스크 큐는 **모두 비워야** 다음 매크로태스크로 넘어갑니다. 그 사이 렌더링도 안 끼어듭니다.

`then().then().then()...` 으로 끝없이 마이크로태스크를 만들면 한 매크로태스크 안에서 무한 루프가 되어 렌더링과 사용자 입력이 모두 멈춥니다. 이 함정 때문에 큰 작업은 `setTimeout` 또는 `scheduler.yield()`로 매크로태스크 사이에 yield해줘야 합니다.

---

## Q4. requestAnimationFrame은 언제 실행되나요?

**A.** **렌더링 단계 직전**에 실행됩니다. 그래서 애니메이션을 setTimeout 대신 rAF로 짜면 렌더링 사이클과 동기되어 부드러워집니다.

setTimeout 16ms는 페인트 시점과 어긋날 수 있어 jank(끊김)가 발생할 수 있고, rAF는 브라우저가 페인트 직전에 항상 호출하므로 정확합니다.

```javascript
function loop() {
  // 그리기 작업
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

---

## Q5. 메인 스레드가 막힐 때 어떻게 풀어주나요?

**A.** 두 가지 전략이 있습니다.

1. **Web Worker로 이동**: CPU 바운드 작업을 메인 스레드 밖으로 분리. 분석/이미지 처리/큰 JSON 파싱.
2. **태스크 분할**: 작업을 잘게 잘라 `setTimeout(fn, 0)` 또는 `scheduler.yield()`로 매크로태스크 사이마다 렌더링이 끼어들 틈을 만들기.

```javascript
async function processChunks(items) {
  for (const chunk of chunks(items, 100)) {
    process(chunk);
    await new Promise(r => setTimeout(r, 0)); // yield
  }
}
```

---

## Q6. React 18의 자동 배칭은 이 모델과 어떻게 연결되나요?

**A.** 한 이벤트 핸들러 안에서 setState를 여러 번 호출해도 **마이크로태스크 시점에 모아서 한 번에 렌더링**합니다.

이전(React 17)에는 이벤트 핸들러 안에서만 배칭했지만, 18부터는 비동기 콜백(`setTimeout`, Promise)에서도 배칭됩니다. 덕분에 불필요한 중간 렌더가 줄어듭니다.

`flushSync`로 강제로 깨고 즉시 렌더링도 가능하지만, 비용이 크므로 정말 필요한 경우에만 사용합니다.

---

## Q7. queueMicrotask는 언제 쓰나요?

**A.** **Promise 객체를 만들지 않고 마이크로태스크 큐에 콜백을 넣고 싶을 때**입니다.

```javascript
queueMicrotask(() => { /* 곧 실행 */ });
```

라이브러리 내부에서 "현재 스택을 마치고 즉시 실행"이 필요할 때 사용합니다. `Promise.resolve().then(fn)`보다 가벼운 대안입니다.

---

## Q8. Node.js의 이벤트 루프는 브라우저와 다른가요?

**A.** 다릅니다. 단계가 더 세분화되어 있습니다.

- timers → pending callbacks → idle/prepare → **poll** → check → close.
- 마이크로태스크는 각 단계 사이에 처리.
- **`process.nextTick`** 은 마이크로태스크보다 더 높은 우선순위 큐.

```javascript
setImmediate(() => console.log('immediate')); // check 단계
setTimeout(() => console.log('timer'), 0);    // timers 단계
process.nextTick(() => console.log('nextTick')); // 우선
```

`nextTick` 남용은 다른 단계가 영원히 실행 안 될 위험이 있어 주의가 필요합니다.

---

## Q9. INP와 이벤트 루프는 어떤 관계인가요?

**A.** **INP는 사용자 입력 직후 다음 paint까지의 시간**입니다. 긴 마이크로태스크/매크로태스크가 끼어 있으면 INP가 나빠집니다.

INP 개선의 핵심은:
- 입력 핸들러를 가볍게 유지.
- 무거운 작업은 `requestIdleCallback`이나 분할 + yield로 미루기.
- React `useTransition`으로 우선순위 낮은 렌더 분리.

이벤트 루프 모델을 이해해야 INP 개선 전략이 보입니다.
