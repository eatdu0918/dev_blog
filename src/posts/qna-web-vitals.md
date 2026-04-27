---
published: true
type: 'qna'
level: 'mid'
title: "Web Vitals(LCP, INP, CLS)는 무엇이고 어떻게 개선하나요?"
date: '2026-04-27'
categories: ['Frontend', 'Performance', 'Web']
---

## Q1. Web Vitals 핵심 3지표를 설명해 주세요.

**A.** Google이 정의한 **사용자 체감 성능 지표**입니다(2024년부터 FID → INP).

- **LCP(Largest Contentful Paint)**: 가장 큰 콘텐츠가 보이기까지. 좋음 ≤ 2.5s.
- **INP(Interaction to Next Paint)**: 상호작용 응답성. 좋음 ≤ 200ms.
- **CLS(Cumulative Layout Shift)**: 누적 레이아웃 이동. 좋음 ≤ 0.1.

각각 **로딩 / 응답성 / 시각적 안정성**을 본다고 보면 됩니다.

---

## Q2. LCP가 안 좋은 페이지를 어떻게 진단하시나요?

**A.** Chrome DevTools Performance 탭에서 **LCP 요소 식별 → 네트워크 폭포 → 병목 추적** 순.

체크 포인트:
- **TTFB**: 서버 응답이 느린가?
- **렌더 차단 리소스**: CSS/JS가 LCP를 늦추는가?
- **이미지 로딩**: 가장 큰 이미지가 lazy로 잡혀 있진 않은가?
- **폰트**: FOIT(보이지 않는 텍스트)으로 LCP가 미뤄지진 않는가?

원인이 보이면 그에 맞는 개선책으로 갑니다.

---

## Q3. LCP는 어떻게 개선하시나요?

**A.** 6가지 도구가 자주 쓰입니다.

- **이미지 최적화**: WebP/AVIF, 적절한 사이즈, `fetchpriority="high"`.
- **CDN + 캐싱**: 사용자 근처에서 응답.
- **서버 응답 시간 단축**: 캐시, edge SSR.
- **렌더 차단 리소스 제거**: critical CSS만 인라인, JS는 `defer`/`async`.
- **폰트**: `font-display: swap` + preload.
- **Preload/Preconnect**: 핵심 리소스 사전 연결.

LCP 후보 이미지에 `loading="eager" fetchpriority="high"`만 줘도 큰 차이가 납니다.

---

## Q4. INP는 정확히 어떻게 측정되나요?

**A.** **페이지 전체 수명에서 사용자 상호작용 후 다음 페인트까지의 거의 최악 지연**입니다.

- 키보드/마우스/터치 입력 → 다음 paint까지의 시간.
- 한 페이지 동안 측정된 인터랙션의 거의 최악(98 percentile 비슷).
- **한 번의 느린 인터랙션이 점수를 망칠 수 있음** — tail latency 관점.

FID(첫 입력 지연)와 달리 INP는 페이지 전체 수명을 봅니다. 더 정확한 사용자 경험 지표입니다.

---

## Q5. INP가 갑자기 나빠졌다면 어떻게 진단하시나요?

**A.** **새 배포에서 메인 스레드를 막는 코드**가 들어갔을 가능성이 큽니다.

체크:
- **무거운 컴포넌트 동기 렌더링**: 큰 리스트, 무거운 차트.
- **큰 third-party 스크립트**: 광고/분석.
- **이벤트 핸들러 안의 무거운 작업**.
- **long task**: 50ms 넘는 메인 스레드 점유 추적.

Chrome DevTools Performance로 long task 위치 확인 + 어떤 함수가 시간을 잡는지 식별합니다.

---

## Q6. INP를 개선하는 도구는 무엇이 있나요?

**A.** 5가지가 핵심입니다.

- **코드 스플리팅 + dynamic import**: 무거운 JS 분할.
- **`scheduler.yield()` / `requestIdleCallback`**: 메인 스레드 양보.
- **React `useTransition` / `useDeferredValue`**: 렌더링 우선순위 분리.
- **이벤트 핸들러 최적화**: debounce/throttle.
- **Web Worker**: 무거운 계산을 별도 스레드로.

핵심 사고: **인터랙션 후 16ms 안에 다음 paint가 가능해야 한다**.

---

## Q7. CLS는 어떻게 개선하시나요?

**A.** **이동 가능한 모든 요소에 공간을 미리 예약**하는 게 핵심입니다.

- **이미지/iframe에 width/height** 또는 `aspect-ratio`.
- **광고/임베드 슬롯** 사전 예약(min-height).
- **폰트 fallback metric 일치**: `size-adjust`, `ascent-override`로 폰트 교체 시 레이아웃 이동 최소화.
- **동적 콘텐츠 삽입은 사용자 액션 후**(쿠키 동의 배너 등을 무작정 위에 띄우면 CLS 폭증).
- **스켈레톤 로더**로 공간 확보.

사용자 입력 직후 500ms 이내의 변화는 의도된 것으로 봐서 CLS에서 제외됩니다.

---

## Q8. Lab 측정과 Field 측정은 어떻게 다른가요?

**A.**
- **Lab**(Lighthouse, DevTools): 통제 환경, 재현 가능. 빠른 디버깅에 적합.
- **Field/RUM**(Web Vitals JS, CrUX): 실 사용자, 다양한 디바이스/네트워크. **Google 검색 랭킹 평가 기준**.

```javascript
import { onLCP, onINP, onCLS } from 'web-vitals';
onLCP(metric => sendToAnalytics(metric));
```

두 결과가 다를 수 있습니다. **실 사용자 데이터로 우선순위 판단**, lab 데이터로 디버깅하는 분업이 정석입니다.

---

## Q9. 보조 지표(TTFB, FCP, TBT)는 언제 보시나요?

**A.** 핵심 3지표가 안 좋을 때 **원인 추적용**입니다.

- **TTFB(Time to First Byte)**: 서버 응답 속도. LCP가 안 좋으면 가장 먼저 점검.
- **FCP(First Contentful Paint)**: 첫 콘텐츠. LCP보다 빠르고 진짜 사용자 체감과는 약간 차이.
- **TBT(Total Blocking Time)**: long task 누적. **INP의 lab 대용**으로 자주 사용.
- **TTI(Time to Interactive)**: 거의 안 씀. INP로 대체됨.

---

## Q10. third-party 스크립트가 성능을 망치면 어떻게 하나요?

**A.** 4가지 전략이 있습니다.

1. **`defer` 또는 `async`**: HTML 파싱을 막지 않게.
2. **iframe + lazy load**: 별도 스레드 격리 + 보일 때만 로드.
3. **자체 호스팅**: GA, 광고 스크립트를 같은 도메인에서 제공.
4. **사용자 액션 이후 로드**: 쿠키 동의 후 또는 첫 인터랙션 후.

Partytown 같은 라이브러리는 third-party 스크립트를 web worker로 옮겨 메인 스레드를 보호합니다.
