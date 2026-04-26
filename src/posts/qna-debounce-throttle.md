---
published: true
type: 'qna'
level: 'junior'
title: "Debounce와 Throttle의 차이는? 언제 어떤 걸 쓰나요?"
date: '2026-04-27'
categories: ['JavaScript', 'Frontend', 'Performance']
---

## 핵심 요약

- **Debounce**: "**마지막 호출 후 N ms** 동안 추가 호출이 없으면 1번 실행". 입력 멈추기 기다림.
- **Throttle**: "**N ms마다 최대 1번** 실행". 일정 간격으로 흐름 제한.

면접에서 자주 나오는 질문이자 프론트엔드 성능 최적화 단골 도구.

## Debounce 사용 예

- **검색창 자동완성**: 사용자가 입력 멈추면 그때 API 호출.
- **윈도우 리사이즈 종료 후 처리**.
- **폼 자동 저장**.

```javascript
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
```

## Throttle 사용 예

- **스크롤 이벤트**: 60Hz로 발생, 16ms마다 1번이면 충분.
- **마우스 이동 추적**.
- **버튼 연타 방지**(API 호출).

```javascript
function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}
```

## Leading vs Trailing edge

- **Leading**: 첫 호출 즉시 실행, 이후 무시.
- **Trailing**: 마지막 호출 후 실행.

Lodash `debounce(fn, ms, { leading: true, trailing: true })`로 둘 다 가능.

검색 자동완성: trailing(타이핑 끝나고). 버튼 연타: leading(첫 클릭 즉시 처리).

## 흔한 실수

- **debounce 함수를 매 렌더마다 새로 생성**: 매번 새 타이머라 효과 없음. React에서는 `useMemo` / `useCallback`으로 함수 인스턴스 유지 필요.
- **throttle인데 trailing 누락**: 마지막 입력이 무시됨.
- **cleanup 안 함**: 컴포넌트 언마운트 후에도 타이머 남아 setState 시 경고.

```javascript
// React 예시
const debouncedSearch = useMemo(() => debounce(search, 300), []);
useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);
```

## 다른 비슷한 기법

- **requestAnimationFrame(rAF)**: 다음 페인트 직전 1번. 60fps 동기화. 스크롤/애니메이션에는 throttle보다 rAF가 더 자연스러움.
- **`requestIdleCallback`**: 브라우저가 한가할 때 실행. 비긴급 작업.

## React에서

- 라이브러리: `use-debounce`, `lodash.debounce`, `react-use`.
- 18+ 의 `useDeferredValue`: 무거운 렌더링 지연. debounce와 다름(값 자체는 즉시 갱신, 파생 작업만 지연).
- Concurrent rendering의 `useTransition`: 렌더링 우선순위 낮춤.

## 자주 헷갈리는 디테일

- 두 기법 모두 **마지막 호출의 인자**를 사용. 도중 인자는 버려짐.
- debounce를 너무 짧게(50ms 등) 잡으면 의미 없음. 사용자 행동 패턴 측정 후 200~500ms.
- throttle은 균등 간격이 아닐 수 있음(타이머 정확도 + 첫 호출 위치).

## 면접 follow-up

- "검색창에서 debounce + 취소를 어떻게?" → AbortController로 진행 중 fetch 취소 + 다음 입력의 debounce 트리거.
- "스크롤 이벤트에 rAF vs throttle?" → rAF가 페인트 동기 + 자동 backpressure. throttle은 시간 간격 보장.
- "Lodash debounce의 cancel/flush?" → cancel = 대기 중인 호출 폐기, flush = 즉시 실행.
