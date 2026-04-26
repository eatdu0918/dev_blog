---
published: true
type: 'qna'
level: 'mid'
title: "Next.js에서 CSR, SSR, SSG, ISR을 어떤 기준으로 선택하시나요?"
date: '2026-04-26'
categories: ['Frontend', 'Next.js', 'Performance']
---

## 핵심 요약

선택의 본질은 **"데이터의 신선도가 얼마나 중요한가"**와 **"누가 보는 페이지인가"**입니다. 정답은 없고 페이지 단위로 다릅니다.

## 한 줄 가이드

- **SSG**: 거의 변하지 않는 콘텐츠(랜딩, 블로그 글, 약관). 가장 빠르고 가장 싸다.
- **ISR**: 자주 변하지 않지만 가끔 변하는 콘텐츠(상품 상세, 카테고리 페이지). 빌드 다시 안 해도 됨.
- **SSR**: 매 요청마다 다른 콘텐츠(개인화 대시보드, 로그인 사용자 마이페이지) + SEO 필요.
- **CSR**: 인증 후 화면, 실시간성 강한 대시보드. SEO가 필요 없으면 가장 단순.

## 의사결정 흐름

저는 새 페이지를 만들 때 다음 순서로 자문합니다.

1. **SEO가 필요한가?** No → CSR 후보. Yes → SSG/ISR/SSR 중 선택.
2. **사용자마다 내용이 다른가?** Yes → SSR. No → SSG/ISR 후보.
3. **빌드 시점 데이터로 충분한가?** Yes → SSG. 시간이 지나면 신선도가 필요 → ISR.
4. **데이터가 거의 실시간이어야 하는가?** Yes → SSR + 짧은 캐시 또는 CSR fetch.

이 흐름만 지켜도 한 페이지에 어울리지 않는 렌더링 방식이 들어가는 사고를 막을 수 있습니다.

## App Router 기준 보강

Next.js 13+ App Router에서는 용어가 약간 바뀌었습니다.

- 기본은 **Static**. fetch에 `cache: 'no-store'`나 `revalidate`를 안 주면 빌드 타임에 정적 생성됩니다(SSG).
- `revalidate: 60`이면 ISR.
- `cache: 'no-store'` 또는 동적 함수(`cookies()`, `headers()`) 사용 시 SSR.
- `'use client'` 컴포넌트에서 `useEffect` + fetch는 사실상 CSR.

여기서 자주 헷갈리는 것이 **"동적 라우트라서 SSR이다"라는 오해**인데, 동적 라우트도 빌드 타임에 `generateStaticParams()`로 SSG가 가능합니다.

## 실무에서 자주 만나는 함정

- **인증이 필요한 페이지를 SSR로 무심코 두면** 캐시 효율이 0이 됩니다. 가능한 한 인증 후 영역은 CSR로 두고, 공개 영역만 SSR/SSG로 가져가는 편이 비용/성능에 유리합니다.
- **ISR의 stale-while-revalidate 동작 이해**가 부족하면 "왜 갱신이 안 되지?"라는 혼란이 옵니다. 첫 요청은 stale을 받고, 백그라운드에서 갱신됩니다. on-demand revalidate로 즉시성을 보강할 수 있습니다.
- **Hydration 비용**은 SSR/SSG 모두에 붙습니다. 서버 렌더링이 빠르다고 끝이 아니라 클라이언트가 복원하는 데 걸리는 시간을 같이 봐야 합니다(TTI 지표).

## 면접 follow-up

- "ISR과 CDN 캐시는 어떻게 상호작용하나요?" → Next.js의 ISR은 자체 디스크 기반 캐시 + Vercel/Cloudflare 같은 엣지 캐시가 결합. revalidate 시 엣지가 어떻게 갱신되는지 설명할 수 있어야 합니다.
- "SEO는 진짜 필요한가요?" → 검색 진입이 트래픽의 큰 비중을 차지하는지 데이터로 확인. 없다면 CSR이 더 단순한 선택입니다.
- "Server Component를 도입하면?" → 데이터 fetching을 서버에서 끝내고 직렬화 비용만 줄어듭니다. 클라이언트 번들이 작아지는 이득이 가장 큽니다.
