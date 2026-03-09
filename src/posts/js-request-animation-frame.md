---
title: "requestAnimationFrame으로 구현하는 부드러운 웹 애니메이션"
description: "setInterval의 한계를 이해하고, 브라우저 렌더링 최적화의 핵심인 requestAnimationFrame의 동작 원리와 장점을 살펴봅니다."
date: "2026-03-08"
tags: ["JavaScript", "Frontend", "Animation", "Performance", "rAF"]
---

# requestAnimationFrame으로 구현하는 부드러운 웹 애니메이션

웹 개발 초기에 화면상의 요소를 움직이게 할 때 가장 먼저 떠오은 방법은 `setInterval`이었다.
"1초에 60번 화면을 다시 그리면 되니까, 약 16.66ms(1000ms / 60) 간격으로 실행하면 충분하겠지"라는 계산이었다. 
하지만 실제 결과물은 기대했던 것만큼 부드럽지 않았고, 때로는 미세하게 끊기는 현상이 발생했다.

매끄러워야 할 애니메이션이 멈칫하거나 건너뛰는 현상(Jank)은 왜 발생하는 것일까? 이는 브라우저의 렌더링 사이클을 고려하지 않았기 때문에 발생하는 필연적인 결과였다.

![부드러운 애니메이션 vs 끊기는 애니메이션](/public/images/js-request-animation-frame.png)

---

## 1. setInterval은 왜 애니메이션에 부적합할까?

주기적인 시간 간격을 설정했음에도 애니메이션이 끊기는 이유는 자바스크립트 엔진의 동작 방식에 있다.
자바스크립트는 싱글 스레드로 동작하며, `setInterval`의 콜백은 설정한 시간에 정확히 실행되는 것이 아니라 **'그 시간이 되면 태스크 큐에 진입할 뿐'**이다.

만약 메인 스레드에서 무거운 연산이 실행 중이라면 애니메이션 콜백은 큐에서 대기하게 된다. 
결국 브라우저가 화면을 갱신하는 시점(VSync)과 코드가 상태를 업데이트하는 시점이 어긋나면서, 프레임이 생략되거나 중복되는 현상이 발생하는 것이다.

---

## 2. requestAnimationFrame의 도입과 장점

이러한 문제를 해결하기 위해 도입된 API가 `requestAnimationFrame`(이하 rAF)이다. 
rAF는 개발자가 임의로 시간을 설정하는 대신, **"브라우저가 다음 화면을 그리기 직전에 정확히 콜백을 실행하도록"** 보장한다.

### 무엇이 다른가?
1. **VSync 동기화**: 모니터의 주사율(60Hz, 144Hz 등)에 맞춰 가장 최적의 타이밍에 콜백을 실행한다.
2. **배터리 및 리소스 절약**: 유저가 다른 탭을 보고 있거나 브라우저가 최소화되어 있을 때, rAF는 자동으로 멈춘다. `setInterval`이 백그라운드에서도 무의미하게 CPU를 갉아먹는 것과는 대조적이다.
3. **프레임 통합**: 여러 개의 애니메이션 요소가 있어도 브라우저가 이를 한 번의 리페인트(Repaint) 과정으로 묶어서 처리해준다.

---

## 3. 코드 비교: 구조적 차이

`setInterval`을 사용한 투박한 방식과 rAF를 활용한 방식의 구조적 차이를 살펴보자.

```javascript
/* [기존 방식: setInterval] */
let pos = 0;
const intervalId = setInterval(() => {
  pos += 5;
  box.style.transform = `translateX(${pos}px)`;
  if (pos > 500) clearInterval(intervalId);
}, 16); // 정확한 실행을 보장할 수 없음
```

```javascript
/* [개선된 방식: requestAnimationFrame] */
let start;
function step(timestamp) {
  if (!start) start = timestamp;
  const progress = timestamp - start;
  
  // 시간 기반 연산으로 주사율에 관계없이 일정한 속도 유지
  const pos = Math.min(progress * 0.5, 500); 
  box.style.transform = `translateX(${pos}px)`;
  
  if (pos < 500) {
    window.requestAnimationFrame(step);
  }
}
window.requestAnimationFrame(step);
```

rAF 방식의 주요 특징 중 하나는 콜백으로 `timestamp` 인자를 전달받는다는 것이다. 
이를 활용하면 프레임 간의 실제 경과 시간을 계산해 위치를 보정할 수 있다. 하드웨어 성능 저하로 프레임 드랍이 발생하더라도, 애니메이션의 실제 이동 속도는 일정하게 유지되는 견고한 설계를 가능하게 한다.

---

## 결론

단순히 동작하는 코드를 넘어서, 브라우저라는 플랫폼의 동작 방식을 이해하고 그 사이클에 동기화되는 코드를 작성하는 것의 중요성을 확인했다.

앞으로 스크롤 이벤트 최적화나 복잡한 애니메이션을 구현할 때, rAF를 적극적으로 활용하여 사용자에게 더 매끄러운 경험을 제공해야 할 것이다.
