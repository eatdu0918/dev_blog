---
published: true
type: 'qna'
level: 'mid'
title: "React 렌더링 최적화 — memo, useMemo, useCallback을 언제 쓰시나요?"
date: '2026-04-26'
categories: ['Frontend', 'React', 'Performance']
---

## Q1. React에서 "렌더링"이란 정확히 무엇을 가리키나요?

**A.** 3단계로 나뉩니다.

1. **render**: state/props 변경 시 컴포넌트 함수가 호출.
2. **reconciliation**: 새 React Element 트리 ↔ 이전 트리 비교.
3. **commit**: 변경된 부분만 DOM에 반영(페인트).

**렌더링이 일어났다 ≠ 느리다**입니다. 함수가 호출되어도 DOM 변경이 없으면 사용자에게는 동일합니다. 최적화는 진짜 비싼 부분이 어디인지 측정 후 결정해야 합니다.

---

## Q2. React.memo는 언제 쓰시나요?

**A.** **자식 컴포넌트의 호출 자체를 스킵**해야 할 때입니다.

```tsx
const Row = memo(function Row({ item, onClick }: Props) { /* ... */ });
```

부모가 다시 렌더링되면 자식 props가 동일해도 함수 호출은 일어납니다. memo는 props 얕은 비교로 이를 스킵합니다.

함정: 부모가 매 렌더마다 **새 객체/함수를 prop으로** 내려주면 얕은 비교가 항상 false → memo 무의미.
```tsx
<Row onClick={() => handle(id)} />          // ❌ 매번 새 함수
<Row onClick={useCallback(() => handle(id), [id])} />  // ✅
```

---

## Q3. useMemo는 무엇을 위한 도구인가요?

**A.** 두 가지 목적입니다.

1. **계산이 비쌀 때 결과 캐싱**.
2. **참조 동등성 유지**(객체/배열을 useEffect 의존성이나 memo 자식에 넘길 때).

```tsx
const filtered = useMemo(() => list.filter(...), [list]);  // 비싼 계산
const config = useMemo(() => ({ a, b }), [a, b]);           // 참조 안정
```

"비싸다"의 기준은 측정입니다. 단순 `arr.map`은 메모이제이션 오버헤드가 더 클 수 있습니다.

---

## Q4. useCallback과 useMemo는 어떻게 다른가요?

**A.** **`useCallback(fn, deps)` = `useMemo(() => fn, deps)`** 입니다. 함수에 특화된 단축형.

`useCallback`이 의미 있는 경우:
- 자식이 `memo`로 감싸져 있음.
- 그 함수가 prop으로 내려감.

이 두 조건이 모두 성립하지 않으면 그냥 오버헤드입니다. "혹시 모르니까" 모든 함수를 useCallback으로 감싸는 건 안티패턴입니다.

---

## Q5. memo로 감쌌는데 효과가 없는 경우는 어떻게 디버깅하시나요?

**A.** 거의 항상 **부모가 매 렌더마다 새 객체/함수를 prop으로 내리는 경우**입니다.

```tsx
// ❌ 매번 새 객체
<Child config={{ size: 10 }} />
<Child onClick={() => handle()} />

// ✅
const config = useMemo(() => ({ size: 10 }), []);
const onClick = useCallback(() => handle(), []);
```

React DevTools Profiler의 "Why did this render?"로 어떤 props가 변경됐는지 추적할 수 있습니다.

---

## Q6. key prop의 진짜 역할은 무엇인가요?

**A.** **같은 key = 같은 컴포넌트 인스턴스**라고 React가 식별합니다. reconciliation의 핵심.

배열 인덱스를 key로 쓰면 사이에 요소를 추가/삭제할 때 상태가 잘못 매칭됩니다.

```tsx
// ❌ 인덱스 key — 정렬/추가 시 폼 입력이 다른 행으로 옮겨가는 버그
items.map((item, i) => <Row key={i} ... />)

// ✅ 안정적 ID
items.map(item => <Row key={item.id} ... />)
```

정렬, 필터링, 중간 삽입이 일어나는 리스트에서 차이가 큽니다.

---

## Q7. React 18의 자동 배칭과 useTransition은 어떻게 다른가요?

**A.**
- **자동 배칭**: 한 이벤트/콜백 안의 setState 여러 번을 모아 한 번 렌더링.
- **`useTransition`**: 상태 업데이트의 우선순위를 "긴급하지 않음"으로 표시 → 다른 인터랙션이 막히지 않게.

```tsx
const [isPending, startTransition] = useTransition();
startTransition(() => setBigList(newList)); // 무거운 업데이트
```

또 **`useDeferredValue`** 는 값 자체는 즉시 갱신하되 그 값을 사용한 무거운 렌더링을 지연합니다. 검색 입력에 자주 씁니다.

---

## Q8. 흔한 React 성능 안티패턴은 무엇인가요?

**A.** 5가지가 자주 보입니다.

1. **모든 컴포넌트를 memo로 감싸기**: 비교 비용 + 사본 보관. 효과 없는 곳에는 오버헤드.
2. **Provider value를 매 렌더마다 새로**: Context 소비자 전체 재렌더. `useMemo` 필수.
3. **상태를 너무 위로 끌어올리기**: 작은 변경에 거대 트리 재렌더. 상태를 **사용 지점 가까이로** 내리기.
4. **거대 컴포넌트 단일 state**: state 분할 또는 컴포넌트 분리.
5. **key에 인덱스**: 위 Q6 참고.

---

## Q9. 대량 리스트 렌더링은 어떻게 최적화하시나요?

**A.** **가상화(virtualization)** 가 메모이제이션보다 압도적으로 효과적입니다.

- **react-window, TanStack Virtual**: 보이는 영역만 DOM에 그림.
- 1만 row → DOM은 ~20개만 → 페인트/메모리 모두 축소.

memo로 행마다 최적화해도 결국 1만 개 element를 만드는 비용이 남습니다. 가상화로 처음부터 element 수를 줄이는 게 정공법입니다.

---

## Q10. React Compiler가 도입되면 memo/useMemo는 안 써도 되나요?

**A.** **거의 그렇습니다**(실험적).

React Compiler는 컴파일 시점에 자동으로 메모이제이션을 삽입합니다. 도입되면 수동 `memo`/`useMemo`/`useCallback`의 상당수가 불필요해집니다.

다만 **현재 시점 기준 도구를 이해하고 있어야**:
- 점진 도입 시 수동 메모와 충돌 디버깅.
- 컴파일러가 못 잡는 케이스(전역 캐시, 외부 mutable state) 직접 처리.
- 코드 리뷰에서 의도 파악.
