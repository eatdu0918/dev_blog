---
published: true
type: 'qna'
level: 'mid'
title: "Web Vitals(LCP, INP, CLS)는 무엇이고 어떻게 개선하나요?"
date: '2026-04-27'
categories: ['Frontend', 'Performance', 'Web']
---

## 핵심 요약

Google이 정의한 **사용자 체감 성능 3가지 핵심 지표**(2024년부터 FID → INP로 교체):

- **LCP(Largest Contentful Paint)**: 가장 큰 콘텐츠가 보이기까지. 좋음 ≤ 2.5s.
- **INP(Interaction to Next Paint)**: 상호작용 응답성. 좋음 ≤ 200ms.
- **CLS(Cumulative Layout Shift)**: 누적 레이아웃 이동. 좋음 ≤ 0.1.

면접에서 "성능 개선 경험" 질문에 이 지표들을 인용하면 신뢰도 ↑.

## LCP — 로딩 속도

페이지 뷰포트에서 가장 큰 이미지/텍스트 블록이 그려진 시점.

### 개선
- **이미지 최적화**: WebP/AVIF, 적절한 사이즈, `loading=eager`(LCP 후보), `fetchpriority="high"`.
- **CDN + 캐싱**: 정적 자산을 사용자 근처에서.
- **서버 응답 시간(TTFB)**: 캐시, edge SSR.
- **렌더 차단 리소스 제거**: CSS는 critical만 인라인, JS는 `defer`/`async`.
- **폰트**: `font-display: swap` + preload.
- **Preload + Preconnect**: 핵심 리소스 미리 연결.

## INP — 응답성 (FID 대체)

페이지 전체 수명에서 사용자 상호작용 후 다음 페인트까지의 **최악 지연**(거의 최악 percentile).

### 개선
- **무거운 JS 분할**: 코드 스플리팅, dynamic import.
- **메인 스레드 차단 줄이기**: long task(>50ms) 감지 + 분할.
- **`scheduler.yield()`**, `requestIdleCallback`로 작업 양보.
- **React**: `useTransition`, `useDeferredValue`로 우선순위 분리.
- **이벤트 핸들러 최적화**: 디바운스/스로틀.
- **워커 활용**: 무거운 계산은 Web Worker로 오프로드.

## CLS — 시각적 안정성

페이지 로드 중 예기치 않은 레이아웃 이동의 누적.

### 개선
- **이미지/iframe에 width/height 명시** 또는 `aspect-ratio`.
- **광고/임베드 슬롯 사전 예약**.
- **폰트 fallback의 metric 일치**(`size-adjust`, `ascent-override`).
- **동적 콘텐츠 삽입은 사용자 액션 후**.
- **스켈레톤 로더**로 공간 확보.

## 측정 도구

- **Chrome DevTools Performance / Lighthouse**: 개발 환경 측정.
- **PageSpeed Insights**: 실험실 + 실사용자 데이터.
- **Web Vitals JS 라이브러리**: 운영 RUM 수집.
  ```javascript
  import { onLCP, onINP, onCLS } from 'web-vitals';
  onLCP(metric => sendToAnalytics(metric));
  ```
- **Chrome User Experience Report(CrUX)**: 실 사용자 데이터.

## 실험실 vs 실사용자

- **Lab**: 통제 환경, 재현 가능. 빠른 디버깅.
- **Field(RUM)**: 실 사용자, 다양한 디바이스/네트워크. **랭킹 평가 기준**.

두 결과가 다를 수 있음. 실 사용자 데이터로 우선순위 판단.

## 그 외 보조 지표

- **TTFB(Time to First Byte)**: 서버 응답 속도.
- **FCP(First Contentful Paint)**: 첫 콘텐츠.
- **TTI(Time to Interactive)**: 거의 안 씀.
- **TBT(Total Blocking Time)**: long task 누적. INP의 lab 대용.

## 프레임워크별 팁

### React/Next.js
- `next/image`: 자동 최적화 + lazy.
- `next/font`: CLS 자동 처리.
- App Router의 RSC: 클라이언트 번들 축소 → INP 개선.
- 동적 import + `loading.tsx`로 점진 렌더.

### Vue/Nuxt
- `<NuxtImg>`, `<NuxtPicture>`.
- 라우트 기반 자동 코드 스플리팅.

## 자주 헷갈리는 디테일

- LCP 후보는 동적으로 바뀜. preload는 가장 큰 후보에만.
- INP는 페이지 전체 수명 — 한 번의 느린 인터랙션이 점수 망침. tail latency 관점.
- CLS는 사용자 입력 직후 500ms 이내의 변화는 제외(의도된 변화로 봄).

## 면접 follow-up

- "LCP가 안 좋은 페이지를 어떻게 진단?" → DevTools에서 LCP 요소 식별 → 네트워크 폭포 → preload/CDN/이미지 최적화 순.
- "INP가 갑자기 나빠졌다면?" → 새 배포에서 무거운 컴포넌트 동기 렌더, 큰 third-party 스크립트 의심. long task 추적.
- "third-party 스크립트(GA, 광고)가 성능을 망친다면?" → `defer`, `iframe + lazy`, 자체 호스팅, 사용자 액션 이후 로드.
