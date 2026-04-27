---
published: true
type: 'qna'
level: 'junior'
title: "Debounce와 Throttle의 차이는? 언제 어떤 걸 쓰나요?"
date: '2026-04-27'
categories: ['JavaScript', 'Frontend', 'Performance']
---

## Q1. Debounce와 Throttle의 차이를 한 줄로 설명해 주세요.

**A.**
- **Debounce**: 마지막 호출 후 N ms 동안 추가 호출이 없으면 **1번** 실행. "입력이 멈추기를 기다림".
- **Throttle**: N ms마다 **최대 1번** 실행. "일정 간격으로 흐름 제한".

```javascript
const debounce = (fn, ms) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

const throttle = (fn, ms) => {
  let last = 0;
  return (...a) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...a); }
  };
};
```

---

## Q2. 각각 언제 쓰시나요?

**A.** 사용자 입력의 성격에 따라 다릅니다.

**Debounce**:
- 검색창 자동완성(타이핑 끝나면 API 호출).
- 윈도우 리사이즈 종료 후 처리.
- 폼 자동 저장.

**Throttle**:
- 스크롤 이벤트(60Hz로 발생, 16ms 간격이면 충분).
- 마우스 이동 추적.
- 버튼 연타 방지.

기준: "끝나기를 기다린다" = debounce, "주기적으로 처리한다" = throttle.

---

## Q3. Leading edge와 Trailing edge의 차이는?

**A.**
- **Leading**: 첫 호출 즉시 실행, 이후 N ms 동안 무시.
- **Trailing**: 마지막 호출 후 N ms가 지나면 실행.

검색 자동완성은 trailing(타이핑 끝나고), 버튼 연타 방지는 leading(첫 클릭 즉시 처리). Lodash `debounce(fn, ms, { leading, trailing })`로 둘 다 가능합니다.

---

## Q4. React에서 debounce를 쓸 때 자주 하는 실수는?

**A.** **매 렌더마다 새 debounce 함수 생성**입니다. 그러면 매번 새 타이머라 효과가 없습니다.

```javascript
// ❌ 매번 새 함수
const onChange = debounce(search, 300);

// ✅ useMemo로 안정 참조
const debouncedSearch = useMemo(() => debounce(search, 300), []);

// 언마운트 시 정리
useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);
```

cleanup을 안 하면 언마운트 후 타이머가 setState를 호출해 경고가 납니다.

---

## Q5. 스크롤 이벤트에 throttle vs requestAnimationFrame 중 무엇이 좋나요?

**A.** **rAF가 보통 더 자연스럽습니다**.

- **rAF**: 다음 페인트 직전 1번. 60fps와 동기. 자동 backpressure(브라우저가 바쁘면 알아서 호출 안 함).
- **throttle**: 시간 간격은 보장되지만 페인트 시점과 동기 안 됨.

부드러운 스크롤 애니메이션은 rAF, 비주얼과 무관한 작업(분석 이벤트 전송)은 throttle이 적절합니다.

---

## Q6. 검색창 debounce에서 진행 중인 fetch는 어떻게 취소하나요?

**A.** `AbortController`로 이전 요청을 취소합니다.

```javascript
let ctrl;
const search = async (q) => {
  ctrl?.abort();
  ctrl = new AbortController();
  const res = await fetch(`/api?q=${q}`, { signal: ctrl.signal });
  // ...
};

const debounced = debounce(search, 300);
```

debounce + abort 조합으로 빠른 타이핑에서도 마지막 결과만 화면에 반영됩니다.

---

## Q7. React 18+의 `useDeferredValue`나 `useTransition`과는 어떻게 다른가요?

**A.** 목적이 다릅니다.

- **debounce**: 함수 호출 자체를 연기.
- **useDeferredValue**: 값은 즉시 업데이트되지만 그 값 기반 무거운 렌더링을 지연. 입력 자체는 즉각 반영.
- **useTransition**: 상태 업데이트의 우선순위를 낮춰 다른 인터랙션을 막지 않음.

검색어 자동완성에서 API 호출 빈도 줄이기 = debounce, 타이핑 중 무거운 리스트 렌더링 부드럽게 = `useDeferredValue`/`useTransition`.

---

## Q8. Lodash debounce의 cancel / flush는 어떤 차이가 있나요?

**A.**
- **cancel**: 대기 중인 호출을 폐기.
- **flush**: 대기 중인 호출을 즉시 실행.

언마운트 직전에는 `cancel`로 누수를 막고, "지금 즉시 검색해" 같은 강제 트리거는 `flush`를 씁니다. 직접 구현할 때도 같은 인터페이스를 만들어 두면 라이브러리 교체가 쉬워집니다.
