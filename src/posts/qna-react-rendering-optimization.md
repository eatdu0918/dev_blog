---
published: true
type: 'qna'
level: 'mid'
title: "React 렌더링 최적화 — memo, useMemo, useCallback을 언제 쓰시나요?"
date: '2026-04-26'
categories: ['Frontend', 'React', 'Performance']
---

## 핵심 요약

- **렌더링 ≠ 커밋 ≠ DOM 페인트**. React가 컴포넌트를 호출(render)해도, reconciliation 결과 변경이 없으면 DOM은 안 바뀝니다.
- 최적화 도구의 본질은 "**children/prop의 참조 동등성을 유지**해서 재렌더링을 막는 것".
- 측정 없이 `memo`/`useMemo`/`useCallback`을 남발하면 **메모이제이션 오버헤드 + 코드 복잡도**만 늘고 효과는 없습니다.

## React가 다시 그리는 순간

1. state/props 변경 → 컴포넌트 함수가 다시 호출(render).
2. 새 React Element 트리 ↔ 이전 트리 비교(reconciliation).
3. 변경된 부분만 DOM에 반영(commit).

자식 컴포넌트는 **부모가 다시 렌더링되면 props가 동일해도 함수 호출은 일어남**. 이때 `React.memo`가 props 얕은 비교로 호출 자체를 스킵.

## key prop의 진짜 역할

리스트 reconciliation에서 React는 **같은 key = 같은 컴포넌트 인스턴스**로 간주합니다.

- 배열 인덱스를 key로 쓰면 사이에 요소를 추가/삭제할 때 **상태가 잘못 매칭**됩니다(폼 입력값이 다른 행으로 옮겨가는 버그).
- 안정적인 ID를 key로 사용. 정렬/필터링 시 차이가 큼.

## React.memo

props가 얕게 같으면 자식 호출 스킵.

```tsx
const Row = memo(function Row({ item, onClick }: Props) { /* ... */ });
```

함정: 부모가 매 렌더링마다 새 객체/함수를 prop으로 내려주면 얕은 비교가 항상 false → memo가 무의미.

```tsx
// 매번 새 함수 → memo 무력화
<Row onClick={() => handle(id)} />

// 안정 참조
const onClick = useCallback(() => handle(id), [id]);
<Row onClick={onClick} />
```

## useMemo

값 계산이 비쌀 때 또는 **참조 동등성을 유지해야 할 때**.

- "비싸다"의 기준은 측정. 단순 `arr.map`은 메모이제이션 오버헤드가 더 클 수 있음.
- **Effect의 의존성 배열에 객체/배열을 넣어야 한다면** useMemo가 거의 필수(아니면 Effect가 매번 재실행).

## useCallback

함수의 참조 동등성 유지. `useMemo(() => fn, deps)`의 단축형입니다.

- 자식이 `memo`로 감싸져 있고 그 함수가 prop으로 내려갈 때만 의미.
- 그렇지 않으면 그냥 오버헤드.

## 흔한 안티패턴

- **모든 컴포넌트를 memo로 감싸기**: 비교 비용 + props 사본 보관 비용. 무거운 자식 또는 리스트 행에만.
- **Provider value를 매 렌더에 새로 만들기**: Context 소비자 전체가 재렌더. `useMemo`로 감싸야 함.
- **상태를 너무 위로 끌어올리기(prop drilling)**: 한 state 변경이 거대한 트리 재렌더 유발. **상태를 사용 지점 가까이로** 내리거나 분리.
- **거대한 컴포넌트 단일 state**: state 분할 또는 컴포넌트 분리로 영향 범위 축소.

## React 18 이후의 변화

- **Automatic batching**: 비동기 콜백 안에서도 자동 배치 → 불필요한 중간 렌더 감소.
- **Transition (`useTransition`)**: 무거운 상태 업데이트를 "긴급하지 않음"으로 표시 → 입력 반응성 유지.
- **`useDeferredValue`**: 검색어 같은 빠른 입력값을 기반으로 무거운 리스트 필터링할 때.

## React Compiler (실험적)

자동으로 메모이제이션을 삽입. 도입되면 수동 `memo`/`useMemo`/`useCallback`의 상당수가 불필요해집니다. 다만 **현재 시점 기준으로는 도구를 이해하고 있어야** 디버깅과 점진 도입이 가능.

## 측정이 먼저

- React DevTools Profiler: 어떤 컴포넌트가 왜 다시 렌더되는지(props/state/parent).
- "Highlight updates when components render" 토글로 시각화.
- 대량 리스트는 가상화(react-window, TanStack Virtual)가 메모이제이션보다 훨씬 효과적.

## 자주 헷갈리는 디테일

- **렌더링이 일어났다 = 느리다는 뜻이 아님**. DOM 변경이 없으면 사용자에게는 동일.
- `useMemo`/`useCallback`은 **캐시 보장 X**. React가 메모리 부담으로 버릴 수 있음. 정확성 로직에 의존하면 안 됨.
- Context는 값이 바뀌면 모든 consumer가 재렌더. 잘게 쪼개거나 selector 패턴(zustand 등) 사용.

## 면접 follow-up

- "memo가 효과 없는 이유 디버깅한 경험?" → 부모가 매번 새 객체를 prop으로 내려주는 케이스가 가장 흔함.
- "useMemo와 useState의 차이?" → useState는 값 변경이 렌더 유발. useMemo는 단지 계산 결과 캐시.
- "Virtual DOM이 빠르다는 말이 맞나?" → 빠르다기보다 **선언형 모델이 가능하게 해주는 추상화**. 직접 DOM 조작이 더 빠를 수도.
