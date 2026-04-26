---
published: true
type: 'qna'
level: 'mid'
title: "JavaScript 이벤트 루프와 브라우저 렌더링 파이프라인의 관계를 설명해주세요. 마이크로태스크와 매크로태스크는 어떻게 다른가요?"
date: '2026-04-26'
categories: ['JavaScript', 'Browser', 'Performance']
---

## 핵심 요약

이벤트 루프는 **하나의 매크로태스크 → 모든 마이크로태스크 → 렌더링 기회**의 사이클을 반복합니다. 이 순서를 정확히 알면 "왜 setState가 즉시 반영되지 않는가", "왜 무한 promise chain이 화면을 멈추는가" 같은 질문에 답할 수 있습니다.

## 한 사이클의 구조

1. **매크로태스크 큐에서 1개를 꺼내 실행**합니다(setTimeout 콜백, I/O 콜백, MessageChannel 등).
2. 그 태스크가 끝난 직후 **마이크로태스크 큐를 비웁니다**(Promise then/catch/finally, queueMicrotask, MutationObserver).
3. 필요하면 **렌더링 단계**(style → layout → paint → composite)가 끼어듭니다. 60fps 환경이면 약 16.6ms마다 한 번 기회.
4. 다시 1로 돌아갑니다.

핵심은 **마이크로태스크는 한 매크로태스크 안에서 모두 비워야 다음으로 넘어간다**는 점입니다. 즉, Promise chain을 무한히 만들면 매크로태스크가 진행되지 못해 렌더링이 멈춥니다.

## 이게 왜 실무에서 중요한가

### 사례 1: setTimeout(fn, 0) vs Promise.resolve().then(fn)

같은 "비동기 즉시 실행"처럼 보여도 실행 순서가 다릅니다.

```javascript
console.log('start');
setTimeout(() => console.log('macro'), 0);
Promise.resolve().then(() => console.log('micro'));
console.log('end');
// start → end → micro → macro
```

마이크로태스크가 매크로태스크보다 항상 먼저 비워지기 때문입니다.

### 사례 2: requestAnimationFrame 타이밍

`requestAnimationFrame` 콜백은 **렌더링 단계 직전**에 실행됩니다. setTimeout으로 애니메이션을 만들면 렌더링 사이클과 어긋나 jank가 발생하고, rAF는 렌더링과 동기화되어 부드럽습니다.

### 사례 3: 큐가 막혔을 때

긴 동기 코드 블록이 매크로태스크 안에 있으면 그 사이 어떤 마이크로태스크도, 어떤 렌더링도 일어나지 않습니다. "스피너가 안 돌아간다"는 증상의 본질이 이것입니다.

대응은 두 가지입니다.

- **Web Worker로 옮기기**: CPU 바운드 작업을 메인 스레드에서 분리.
- **태스크 분할**: `setTimeout`이나 `scheduler.yield()`로 작업을 잘게 잘라 매크로태스크 사이마다 렌더링이 끼어들 틈을 만듭니다.

## React와의 연결

React 18의 **자동 배칭**은 이 모델 위에서 동작합니다. 한 이벤트 핸들러 안에서 setState 여러 번 호출되면 마이크로태스크 시점에 모아 한 번에 처리합니다. 이 덕분에 불필요한 리렌더가 줄어듭니다.

`flushSync`를 쓰면 이 배칭을 강제로 깨고 즉시 반영하지만, 렌더링 비용을 직접 부담하게 되니 정말 필요한 경우에만 사용해야 합니다.

## 면접 follow-up

- "queueMicrotask는 언제 쓰나요?" → Promise를 만들지 않고 마이크로태스크 큐에 콜백을 넣고 싶을 때. 라이브러리 내부에서 가끔 보입니다.
- "Node.js의 이벤트 루프는 다른가요?" → 단계가 더 세분화(timers, pending, poll, check, close)되어 있고, `process.nextTick`이 마이크로태스크보다 우선순위가 높습니다.
- "INP(Interaction to Next Paint)와의 관계는?" → 사용자 입력 후 다음 paint까지 걸린 시간. 긴 마이크로태스크 / 매크로태스크가 끼면 INP가 나빠집니다. 그래서 yield 패턴이 중요해졌습니다.
