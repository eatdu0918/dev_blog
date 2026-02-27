---
title: "React와 Vue의 핵심 설계 철학 차이: 직접 구현하며 배운 점"
date: "2026-02-27"
description: "React의 단방향 데이터 흐름과 불변성, Vue의 Proxy 기반 반응성 시스템을 순수 JavaScript로 직접 시뮬레이션 하며 두 프레임워크의 구조적 차이를 학습한 과정을 공유합니다."
---

프론트엔드 생태계를 새롭게 탐색하다 보니 가장 많이 비교되는 두 라이브러리(프레임워크)인 React와 Vue를 마주하게 되었습니다. 처음에는 단순히 컴포넌트 작성 방식이나 문법, 템플릿 엔진의 유무 정도의 차이라고만 생각했습니다. 하지만 두 도구가 상태(State)를 관리하고 화면을 렌더링하는 핵심 철학을 들여다보니 전혀 다른 문제 해결 방식을 취하고 있었습니다.

이 글에서는 React의 '불변성과 단방향 데이터 흐름', 그리고 Vue의 '리액티브(Reactivity) 시스템'이라는 다소 추상적인 개념을 가장 밑바닥 수준의 JavaScript로 직접 흉내 내어 구현해 본 과정을 정리하고, 그 과정에서 얻은 깨달음을 기록해 보려 합니다.

<img src="/images/react_vs_vue.png" alt="React 불변성과 Vue 프록시 반응성 비교" style="max-width: 100%;" />
*React의 단방향 데이터 흐름과 Vue의 반응성 체계 비교*

## 두 프레임워크의 상태 변화 감지 방식 차이

상태가 변했을 때 이를 감지하고 UI를 업데이트하는 과정은 모든 최신 프론트엔드 도구의 핵심입니다. React와 Vue는 이 목적을 달성하기 위해 근본적으로 다른 접근법을 채택하고 있었습니다.

### React: 불변성(Immutability)과 명시적 업데이트

React는 상태 객체가 변경되었는지를 판단할 때 **객체의 참조(Reference)**를 비교합니다. 즉, 객체 내부의 값만 슬쩍 바꾸는 '변이(Mutation)' 방식으로는 React가 상태의 변화를 알아차릴 수 없습니다. 완전히 새로운 객체를 만들어서 넘겨주어야만 변경을 감지하고 리렌더링을 시작합니다.

이러한 개념이 내부적으로 어떻게 동작할지 순수 JavaScript로 흉내 내 보았습니다.

```typescript
// React의 useState 불변성 및 렌더링 원리 시뮬레이션
let state = { count: 0 };
let renderCount = 0;

function render() {
  renderCount++;
  console.log(`Rendered ${renderCount} times. Current count:`, state.count);
}

function setState(newState) {
  // 객체의 참조(메모리 주소)가 다를 때만 렌더링을 업데이트
  if (state !== newState) {
    state = newState;
    render(); 
  }
}

// ❌ 상태 내부 값은 변했지만, 렌더링 로직은 트리거되지 않습니다.
state.count = 1; 

// ✅ 불변성을 지킨 업데이트 (새로운 객체 할당)
setState({ count: state.count + 1 });
```

이 구조의 가장 큰 장점은 데이터 흐름이 단방향으로 유지되어, 상태 변경 내역을 추적하고 버그를 잡아내기가 훨씬 용이하다는 점이었습니다. 예측 가능성을 최우선으로 두는 견고한 설계 철학을 배울 수 있었습니다.

### Vue: 최신 JavaScript Proxy를 활용한 자동 감지(Reactivity)

반면 Vue 3는 JavaScript 내장 기능인 `Proxy`를 활용하여 객체의 속성 접근과 수정을 중간에서 가로채는 마법을 부립니다. 개발자가 상태의 값을 직접 바꾸더라도, 이를 Proxy가 캐치하여 자동으로 필요한 부수 효과(렌더링 등)를 실행해 줍니다. 

따라서 React처럼 매번 새로운 객체를 반환하며 불변성을 유지할 필요 없이, 훨씬 직관적인 코드 작성이 가능했습니다.

```typescript
// Vue3의 reactive 원리 시뮬레이션
function reactive(target, sideEffect) {
  return new Proxy(target, {
    set(obj, prop, value) {
      obj[prop] = value;
      // 속성 값이 변경되면 자동으로 부수효과(렌더링)를 발생시킵니다.
      sideEffect(); 
      return true;
    }
  });
}

function renderProxyEffect() {
  console.log('UI가 자동으로 업데이트 되었습니다.');
}

// 상태 초기화
const state = reactive({ count: 0 }, renderProxyEffect);

// 변수를 직접 변이(mutation)하는 순간, 가로채기가 발생하여 렌더링이 트리거됩니다.
state.count++;
```

이러한 접근 방식은 데이터 변화를 자동으로 추적해 주어 불필요한 보일러플레이트 코드를 줄여주었습니다. 개발자 경험(DX) 측면에서 매우 편안하고 직관적이라는 점이 인상적이었습니다.

## 기술의 철학을 이해한다는 것

React의 '불변성과 예측 가능성', 그리고 Vue의 '반응성과 개발자 편의성'은 각각 뚜렷하고 합리적인 설계 철학에서 비롯되었습니다.

단순히 프레임워크의 사용법이나 문법을 암기하는 것에서 벗어나, JavaScript 기본 기능(`===` 참조 비교와 `Proxy`)을 통해 두 시스템을 직접 흉내 내보니 **이 도구의 창시자는 어떤 형태의 문제 상황을 해결하고 싶었을까?**라는 관점으로 기술을 바라볼 수 있게 되었습니다.

어떤 프레임워크가 더 우월하다고 정의할 수 있는 문제는 아닌 듯합니다. 결국 프로젝트의 요구 사항, 팀의 선호도, 그리고 해결하고자 하는 문제의 복잡도에 따라 각 도구의 장점이 가장 잘 빛날 수 있는 곳이 존재할 것입니다. 앞으로 새로운 도구를 학습할 때에도 항상 이처럼 가장 기초적인 원리부터 뜯어보는 방식이 큰 도움이 되리라 확신합니다.
