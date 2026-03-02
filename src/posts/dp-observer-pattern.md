---
title: "옵저버(Observer) 패턴: 상태 변화를 효율적으로 감지하며 배운 프론트엔드의 핵심 원리"
date: "2026-03-02"
description: "상태 변경 시 여러 객체에 자동으로 알림을 보내는 옵저버 패턴의 원리를 분석하고, 자바스크립트로 커스텀 스토어를 직접 구현해보며 얻은 데이터 흐름의 통찰을 공유합니다."
---

프론트엔드 환경에서 사용자 인터페이스(UI)를 구성하다 보면, 하나의 상태(State)가 변경되었을 때 화면 곳곳의 여러 요소가 동시에 갱신되어야 하는 상황과 자주 마주치게 되었습니다. 예를 들어, 사용자가 장바구니에 상품을 담으면 화면 오른쪽 위의 '장바구니 아이콘 배지' 숫자가 올라가야 하고, 동시에 '결제 금액 창'도 갱신되어야 했습니다.

초기에는 상태를 변경하는 함수 안에서 다른 컴포넌트들을 직접 호출하여 UI를 갱신하도록 코드를 작성하곤 했습니다. 하지만 이러한 방식은 변경이 발생할 때마다 관련 없는 수많은 코드 파일들을 뒤져가며 갱신 코드를 일일이 추가해야 하는 심각한 유지보수 문제를 낳았습니다. 이를 해결하기 위해 상태의 변화를 관찰하고 퍼뜨리는 '옵저버 패턴(Observer Pattern)'을 학습하고 직접 밑바닥부터 구현해 보았습니다.

<img src="/images/observer_pattern_concept.png" alt="옵저버 패턴의 구독과 발행 과정" style="max-width: 100%;" />
*주체(Subject)가 변경 사항을 등록된 관찰자(Observer)들에게 자동으로 전달하는 흐름*

## 주체(Subject)와 관찰자(Observer)의 철저한 분리

옵저버 패턴의 핵심은 이벤트를 발생시키는 **주체(발행자 혹은 스토어)**와, 그 이벤트가 발생하길 기다렸다가 반응하는 **관찰자(구독자 혹은 리스너)** 사이의 단단한 연결 고리를 느슨하게 풀어내는 데 있었습니다. 

이는 현실에서 유튜브 채널을 '구독'하는 것과 놀랍도록 비슷했습니다. 크리에이터(발행자)는 구독자가 누구인지, 그들이 영상을 보고 어떤 행동을 할지 구체적으로 알 필요가 없습니다. 그저 새로운 영상이 올라왔을 때 구독 명단에 있는 사람들에게 일괄적으로 알림만 뿌려주면 되기 때문입니다.

## 커스텀 스토어를 통한 옵저버 패턴 시뮬레이션

이러한 패턴이 내부적으로 어떻게 동작하는지 정확히 파악하기 위해, 외부 라이브러리에 의존하지 않고 순수 자바스크립트로 상태 관리 스토어(`Store`)를 직접 만들어 실험해 보았습니다.

아래는 실제로 구현하고 터미널에서 구동 확인까지 마친 테스트 코드입니다.

```typescript
// test-observer.mjs
class Store {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = []; // 구독자 명단 역할을 하는 배열
  }

  // 상태 변화를 관찰하고자 하는 리스너를 배열에 등록(Subscribe)합니다.
  subscribe(listener) {
    this.listeners.push(listener);
    // 구독 취소(Unsubscribe) 함수를 반환하여 메모리 누수를 방지합니다.
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // 상태 변경 및 발행(Publish) 역할
  setState(newState) {
    this.state = { ...this.state, ...newState };
    // 상태가 변경될 때마다 등록된 모든 리스너에게 최신 상태를 전달합니다.
    this.listeners.forEach((listener) => listener(this.state));
  }

  getState() {
    return this.state;
  }
}

// 1. 스토어 생성
const store = new Store({ count: 0 });

// 2. 첫 번째 구독자: 로그를 출력하는 역할
const unsubscribeLogger = store.subscribe((state) => {
  console.log(`[Logger] 상태가 업데이트 되었습니다: count = ${state.count}`);
});

// 3. 두 번째 구독자: 특정 조건에만 반응하여 분석 이벤트를 전송하는 역할
const unsubscribeAnalytics = store.subscribe((state) => {
  if (state.count >= 3) {
    console.log(`[Analytics] count가 3 이상이 되었습니다. 특수 이벤트 전송!`);
    // 한번 호출된 후 스스로 구독을 취소합니다.
    unsubscribeAnalytics();
  }
});

// --- 테스트 케이스 실행 --- //

console.log('--- 1차 증가 ---');
store.setState({ count: store.getState().count + 1 });

console.log('--- 2차 증가 ---');
store.setState({ count: store.getState().count + 1 });

console.log('--- 3차 증가 ---');
store.setState({ count: store.getState().count + 1 });

console.log('--- 4차 증가 ---');
store.setState({ count: store.getState().count + 1 });
```

위의 테스트 코드를 터미널 환경에서 실행했을 때, 제가 예상했던 완벽한 흐름이 나타나는 것을 확인할 수 있었습니다.

```text
--- 1차 증가 ---
[Logger] 상태가 업데이트 되었습니다: count = 1
--- 2차 증가 ---
[Logger] 상태가 업데이트 되었습니다: count = 2
--- 3차 증가 ---
[Logger] 상태가 업데이트 되었습니다: count = 3
[Analytics] count가 3 이상이 되었습니다. 특수 이벤트 전송!
--- 4차 증가 ---
[Logger] 상태가 업데이트 되었습니다: count = 4
```

주목할 점은 `Store` 클래스는 3번 코드를 거치면서 `Analytics` 로직이 등록되었는지, 어떤 조건에서 구독을 취소하는지조차 알지 못한다는 점이었습니다. 그저 상태를 업데이트 할 때마다 자신이 보관하고 있던 함수들을 순서대로 실행시켰을 뿐입니다. 결과적으로 4번째 증가가 일어났을 때는 스스로 구독을 해지한 분석 리스너가 더 이상 호출되지 않고 훌륭하게 격리되었습니다.

## 단방향 데이터 흐름을 이해하는 초석이 되다

이 작은 스토어를 만들어보니 그동안 무작정 가져다 쓰기만 했던 Redux, Zustand와 같은 상태 관리 라이브러리들, 나아가 DOM 이벤트를 처리하는 `addEventListener` 속에서 이 옵저버 패턴이 어떻게 녹아있는지 선명하게 이해할 수 있었습니다. 

데이터의 생성 주기와 UI 반영 주기가 서로 강하게 얽혀 있던 과거의 프로젝트에서 벗어나, 상태를 발행하는 쪽(Publisher)과 상태를 받아 UI를 다시 그리는 쪽(Subscriber)의 관심사를 완전히 분리하는 것이 복잡한 프론트엔드 아키텍처를 유연하게 유지하는 비결임을 확실히 깨달았습니다. 이러한 디자인 패턴의 기초가 탄탄할수록, 이후 새로운 프레임워크나 패러다임이 등장하더라도 핵심적인 원리는 꿰뚫어 볼 수 있겠다는 자신감을 얻은 소중한 시간이었습니다.
