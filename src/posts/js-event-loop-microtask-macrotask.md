---
title: "이벤트 루프 심화: Microtask Queue와 Macrotask, 그리고 렌더링 최적화"
description: "setTimeout과 Promise의 실행 순서, 그리고 브라우저 렌더링(페인팅) 사이에 숨겨진 Event Loop의 가혹한 줄다리기를 분석합니다."
date: "2026-02-26"
tags: ["JavaScript", "Frontend", "Event Loop", "Performance"]
---

# 이벤트 루프 심화: Microtask Queue와 Macrotask, 그리고 렌더링 최적화

프론트엔드 개발에 입문하면 가장 먼저 듣게 되는 신화(Myth) 같은 문장이 있다. 
"JavaScript는 싱글 스레드(Single-Threaded) 언어다. 하지만 비동기(Asynchronous)로 동작한다."

이 모순된 문장을 이해하기 위해 원리를 파악하기 위해 콜 스택(Call Stack)과 태스크 큐(Task Queue), 그리고 그 둘 사이를 쉴 새 없이 오가는 '이벤트 루프(Event Loop)'의 그림을 머릿속에 그린다. `setTimeout`으로 넘긴 콜백 함수는 스택이 다 비워질 때까지 기다렸다가 큐에서 빠져나와 실행된다는 사실을 뿌듯하게 깨닫는다. 

하지만 실무에서 수만 건의 데이터를 렌더링하거나 복잡한 애니메이션을 제어하다 보면, 단순히 '비동기로 넘겼으니 언젠간 돌겠지'라는 안일한 생각은 곧 브라우저 화면의 멈춤(Freezing) 현상이라는 혹독한 결과로 돌아온다.

프론트엔드 개발자라면 꼭 알아야 할, 단순히 큐(Queue)가 하나가 아니라는 사실. 그리고 브라우저가 화면을 그리는 렌더링 파이프라인(Rendering Pipeline)과 이 큐들이 어떤 순서로 경쟁하는지에 대한 심연을 들여다보자.

---

## 1. 큐(Queue)에도 뼈대와 족보가 있다

자바스크립트의 런타임 환경(주로 브라우저)에서 비동기 작업을 대기시키는 큐는 결코 평등하지 않다. 크게 두 가지의 귀족 계급으로 나뉜다.

### Macrotask Queue (혹은 그냥 Task Queue)
우리가 흔히 알고 있는 가장 대중적인 큐다.
- **포함되는 작업들**: `setTimeout`, `setInterval`, `UI I/O 이벤트`, `네트워크 타이머` 등.

### Microtask Queue
뒤늦게 등장했지만 Macrotask보다 **무시무시하게 높은 절대적인 우선순위**를 가진 큐다.
- **포함되는 작업들**: `Promise.then/catch/finally` 콜백, `MutationObserver`, Node.js의 `process.nextTick`.

다음의 코드를 보자. 무엇이 먼저 찍힐까?

```javascript
console.log('1. Script start');

setTimeout(() => {
  console.log('2. setTimeout (Macrotask)');
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise (Microtask)');
});

console.log('4. Script end');
```

답은 너무나 명확하다. `1 -> 4 -> 3 -> 2` 순서다.
콜 스택에 있던 1과 4가 찍히고 스택이 비워진다. 이벤트 루프는 가장 먼저 **"Microtask Queue에 일감이 있는지"** 확인한다. Promise의 콜백(3)이 있으므로 이를 스택으로 끌어올려 실행한다. Microtask 큐가 **완전히 텅 빌 때까지** 이벤트 루프는 다른 곳에 시선을 주지 않는다. 

그제야 비로소 Macrotask 큐에 있던 `setTimeout`의 콜백(2)이 실행된다.

---

## 2. 무한 Microtask의 공포, 화면이 멈추는 이유

Microtask의 우선순위가 높다는 것은 강력한 장점이지만, 양날의 검이다. 
Event Loop의 규칙은 가혹하다. **"Microtask Queue가 100% 비워지기 전까지는, 다음 화면 렌더링(Painting)으로 안 넘어간다."**

```javascript
function blockRendering() {
  Promise.resolve().then(() => {
    // 내부에서 재귀적으로 계속해서 자신을 Microtask에 우겨넣는다.
    blockRendering(); 
  });
}
```

위 코드를 실행시키면 브라우저 화면은 완전히 '먹통(Freeze)'이 된다. 사용자가 스크롤을 하거나 버튼을 눌러도 반응하지 않는다.

이벤트 루프는 현재의 Call Stack을 모두 비우고 Microtask Queue를 처리하러 간다. 그런데 처리하는 와중에 또 새로운 Promise가 추가된다. 이벤트 루프는 "Microtask가 찰리스 초콜릿 공장처럼 계속 나오네? 다 비울 때까진 Macrotask(유저 클릭 이벤트 등)도 안 가고 렌더링 파이프라인도 안 가!" 라며 그곳에 무한히 갇혀버리는 것이다.

---

## 3. 렌더링 파이프라인과 requestAnimationFrame (rAF)

그렇다면 성능 최적화를 위해 브라우저가 화면을 그리는(Painting) 타이밍은 이벤트 루프의 어느 시점에 개입할까?

일반적으로 모니터의 주사율(60Hz)에 맞춰 브라우저는 약 `16.6ms`마다 한 번씩 화면을 새로 그려야 부드러운 애니메이션이 유지된다.
이벤트 루프의 1 사이클(Tick) 흐름은 대체로 다음과 같다.

1. `Call Stack`에서 현재 실행 중인 태스크(하나의 Macrotask 단위)를 모두 처리.
2. `Microtask Queue`를 지독하게 전부 비움.
3. **(렌더링 타이밍이 도래했다면) 렌더링 파이프라인 (Style 재계산 -> Layout -> Paint) 실행.**
4. 다음 `Macrotask Queue`에서 대기 중인 콜백 하나를 가져옴.

여기서 핵심은 **렌더링은 Macrotask와 Macrotask 사이, 그리고 Microtask가 끝난 직후**에 일어난다는 것이다.

### 최적화의 정수, requestAnimationFrame

React나 Vue 같은 트리를 기반으로 무거운 UI 연산을 하거나 애니메이션 엔진을 바닥부터 구현할 때, 절대 `setTimeout`을 쓰지 않고 `requestAnimationFrame`을 쓰는 근본적인 이유가 통제권(Control)에 있다.

`setTimeout(..., 16)`은 "16ms 뒤에 Macrotask 큐에 넣어줄게"라는 뜻이다. 하지만 그 큐 앞에 엄청나게 무거운 다른 콜백 수십 개가 밀려있다면? 내 애니메이션 함수는 16ms가 아니라 50ms, 100ms 뒤에나 불릴 수도 있다. 화면이 버벅이게(Jank) 된다.

반면 `requestAnimationFrame`의 콜백 함수는 Macrotask나 Microtask 큐에 들어가는 게 아니라, **"브라우저가 다음번 렌더링 파이프라인을 실행하기 바로 직전(Before Paint)"** 이라는 특수한 타이밍에 실행됨을 100% 보장받는다.

---

## 맺으며

브라우저의 이벤트 루프는 당신의 코드를 무자비하게 큐에 넣고 빼내는 스케줄러다.
어떤 로직을 즉시 실행(Synchronous)시킬지, Microtask로 던져서 데이터 가공만 빠르게 먼저 치를지, 아니면 Macrotask로 미루거나 `rAF`에 태워 브라우저의 호흡(Rendering)에 맡길지 결정하는 것은 온전히 프론트엔드 개발자의 몫이다.

"버벅거린다"면 리액트를 탓하기 전에, 당신의 무거운 데이터 변환 로직이 쓸데없이 Microtask를 꽉 쥐고 렌더링을 가로막고 있지는 않은지 이벤트 루프의 심연을 들여다보라.
