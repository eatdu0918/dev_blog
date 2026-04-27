---
published: true
type: 'qna'
level: 'mid'
title: "Next.js에서 CSR, SSR, SSG, ISR을 어떤 기준으로 선택하시나요?"
date: '2026-04-26'
categories: ['Frontend', 'Next.js', 'Performance']
---

## Q1. 4가지 렌더링 방식의 차이를 한 줄씩 설명해 주세요.

**A.** 데이터의 **신선도**와 **누가 보는 페이지**로 갈립니다.

- **SSG(Static)**: 빌드 시점에 HTML 생성. 거의 변하지 않는 콘텐츠 — 랜딩, 블로그 글, 약관. 가장 빠르고 가장 쌉니다.
- **ISR**: SSG + 일정 주기 또는 on-demand 재생성. 자주 안 변하지만 가끔 변하는 콘텐츠 — 상품 상세, 카테고리 페이지.
- **SSR**: 요청마다 서버가 렌더링. 사용자별로 다른 콘텐츠 + SEO 필요 — 개인화 대시보드, 마이페이지.
- **CSR**: 빈 HTML + JS가 클라이언트에서 그림. 인증 후 화면, 실시간 대시보드. SEO가 필요 없으면 가장 단순.

---

## Q2. 새 페이지를 만들 때 어떤 순서로 결정하시나요?

**A.** 4단계 자문법입니다.

1. **SEO가 필요한가?** No → CSR. Yes → 다음.
2. **사용자마다 내용이 다른가?** Yes → SSR. No → 다음.
3. **빌드 시점 데이터로 충분한가?** Yes → SSG. 시간이 지나면 갱신 필요 → ISR.
4. **거의 실시간이어야 하는가?** Yes → SSR + 짧은 캐시 또는 CSR fetch.

이 흐름만 지키면 한 페이지에 부적합한 방식이 들어가는 사고가 줄어듭니다.

---

## Q3. App Router에서 SSR/SSG는 어떻게 결정되나요?

**A.** 기본은 **Static**이고, 코드의 신호로 동적 렌더링이 됩니다.

- `fetch(url)` 기본: 빌드 타임 정적 = SSG.
- `fetch(url, { next: { revalidate: 60 } })` = ISR.
- `fetch(url, { cache: 'no-store' })` 또는 `cookies()`, `headers()` 사용 = SSR.
- `'use client'` + `useEffect` fetch = CSR.

자주 하는 오해: "동적 라우트라서 SSR이다." 동적 라우트도 `generateStaticParams()`로 SSG가 가능합니다.

---

## Q4. 인증이 필요한 페이지를 SSR로 두면 어떤 문제가 생기나요?

**A.** **캐시 효율이 0**이 됩니다. 사용자마다 다른 응답을 매번 서버가 만들어야 해서 비용도 늘고 응답 시간도 일정하지 않습니다.

해결 패턴:
- 공개 영역(SEO 필요한 부분)은 SSG/SSR.
- 인증 후 화면은 **CSR로 분리** + 공통 레이아웃만 서버 렌더링.
- 또는 SSR 후 사용자별 부분만 streaming/Suspense로 클라이언트에서 채우기.

---

## Q5. ISR의 stale-while-revalidate가 헷갈립니다. 어떻게 동작하나요?

**A.** "**첫 요청은 stale을 즉시 응답하고, 백그라운드로 갱신**"이 핵심입니다.

- `revalidate: 60`: 60초가 지난 후 첫 요청은 **이전 캐시(stale)** 를 받음. 동시에 백그라운드 재생성. 그 다음 요청부터 새 데이터.
- 즉시 갱신이 필요하면 `revalidatePath()` / `revalidateTag()` 로 on-demand 재생성.

"왜 갱신이 안 되지?"라는 혼란은 대부분 첫 요청이 stale을 받는 동작을 모르고 있어서입니다.

---

## Q6. Hydration 비용은 SSR/SSG에서도 부담인가요?

**A.** 네. 서버에서 HTML이 빨리 와도 클라이언트가 React 트리를 복원(hydrate)해야 인터랙션이 됩니다. TTI(Time to Interactive)가 그래서 LCP보다 늦습니다.

개선 방법:
- **Server Component(RSC)**: 클라이언트 번들 자체를 줄여 hydration 부담 감소.
- **Selective Hydration / Streaming SSR**: 필요한 부분부터 인터랙션 가능.
- 무거운 컴포넌트는 dynamic import + lazy.

---

## Q7. ISR과 CDN 캐시는 어떻게 상호작용하나요?

**A.** Next.js의 ISR은 **서버의 디스크/원격 캐시 + CDN 엣지 캐시**의 2단 구조입니다.

- 빌드된 페이지가 Vercel/Cloudflare 같은 엣지로 배포.
- `revalidate` 시점에 서버에서 재생성 → 엣지로 invalidate 신호 전파.
- on-demand revalidate는 즉시성 보장이지만 엣지 갱신 지연이 있을 수 있어 모니터링이 필요합니다.

---

## Q8. SEO가 정말 필요한지는 어떻게 판단하시나요?

**A.** 데이터로 확인합니다.

- GA/Search Console에서 **검색 진입 비율**.
- 핵심 페이지의 인덱싱 상태.
- 경쟁사 vs 자사 SERP 노출.

검색 비중이 작은 사내 도구나 인증 후 SaaS는 CSR이 단순하고 충분합니다. SEO를 "기본값으로 켜둔다"는 자세보다 비용으로 측정하는 게 맞습니다.
