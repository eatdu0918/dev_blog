---
published: true
type: 'qna'
level: 'mid'
title: "CORS는 어떻게 동작하고, 왜 자꾸 막히나요?"
date: '2026-04-26'
categories: ['Web', 'Security', 'Network']
---

## 핵심 요약

- **CORS는 보안 메커니즘이 아닙니다**. SOP(Same-Origin Policy)라는 브라우저 안전장치를 **완화**해 주는 규약.
- 막는 것은 **브라우저**입니다. 서버는 응답을 정상적으로 보냈고, **읽지 못하게 차단**될 뿐.
- 따라서 curl/Postman은 CORS 영향 없음. 같은 요청이 브라우저에서만 막히는 이유.

## SOP, Origin, "Cross-Origin"

**Origin = scheme + host + port**. 셋 중 하나라도 다르면 cross-origin.

- `https://a.com` ↔ `http://a.com`: 다름(scheme).
- `https://a.com` ↔ `https://api.a.com`: 다름(host).
- `https://a.com:443` ↔ `https://a.com:8443`: 다름(port).

## 단순 요청 vs Preflight

브라우저가 두 종류로 분기합니다.

### 단순 요청(Simple request) 조건
- 메서드: GET / HEAD / POST.
- Content-Type: `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`.
- 커스텀 헤더 없음(`Authorization`, `X-Custom` 등 X).

조건에 해당하면 **바로 본 요청**을 보내고, 응답에 `Access-Control-Allow-Origin`이 없으면 JS가 응답을 못 읽음.

### Preflight (`OPTIONS`)

조건을 벗어나면 본 요청 전에 **OPTIONS 사전 요청**으로 서버 허가를 확인.

- 요청 헤더: `Origin`, `Access-Control-Request-Method`, `Access-Control-Request-Headers`.
- 응답 헤더: `Access-Control-Allow-Origin`, `Allow-Methods`, `Allow-Headers`, `Max-Age`(캐싱).

`Max-Age`로 preflight 응답을 일정 시간 캐시하면 매 요청마다 OPTIONS가 안 날아갑니다(보통 600~86400초).

## credentials (쿠키/Authorization 동봉)

쿠키나 `Authorization` 헤더를 같이 보내려면 두 쪽 다 명시 필요.

- 클라이언트: `fetch(url, { credentials: 'include' })`.
- 서버: `Access-Control-Allow-Credentials: true` + **`Access-Control-Allow-Origin`을 와일드카드(`*`) 금지**, 정확한 origin 반환.

가장 흔한 실수 1순위. `Allow-Origin: *` + credentials 조합은 브라우저가 거부.

## 응답 헤더 주요 항목

- `Access-Control-Allow-Origin`: 허용 origin. 동적 반환 시 **`Vary: Origin`** 추가(캐시 오염 방지).
- `Access-Control-Allow-Methods`: preflight에서만 의미.
- `Access-Control-Allow-Headers`: 클라이언트가 보낼 커스텀 헤더 화이트리스트.
- `Access-Control-Expose-Headers`: JS에서 읽게 할 응답 헤더(기본은 단순 헤더만 노출). 페이지네이션의 `X-Total-Count` 등.
- `Access-Control-Max-Age`: preflight 캐시.

## 자주 빠지는 함정

- **에러 응답에 CORS 헤더 누락**: 4xx/5xx에도 헤더가 없으면 브라우저는 "CORS 에러"로 보고. 실제 원인은 다른 곳.
- **프록시/CDN이 OPTIONS를 가로챔**: 백엔드까지 안 가는 케이스. 게이트웨이 설정 점검.
- **리다이렉트 + preflight**: preflight 응답에서 redirect는 금지. 한 번에 끝나야 함.
- **개발자 도구 Network 탭에서 preflight를 못 봐서 디버깅 헤맴**: "Other" 필터 또는 "All" 확인.

## CORS는 보안 도구가 아니다

- 서버는 여전히 **인증/인가를 직접** 해야 합니다. CORS가 막아주는 건 "다른 origin의 JS가 응답을 읽는 것"뿐.
- CSRF 방어를 CORS로 대체할 수 있다는 통념은 위험. CSRF는 SameSite 쿠키, 토큰 검증이 본 책임.

## 실무 해결 패턴

1. **같은 origin으로 통합**: 프론트와 API를 같은 도메인 + 경로로 둠(Next.js의 API routes, 리버스 프록시). CORS 자체가 사라짐.
2. **개발 환경 프록시**: Vite/CRA의 `proxy` 옵션으로 dev 서버가 백엔드로 포워딩.
3. **명시적 화이트리스트**: 운영은 origin 목록을 환경변수로 관리.
4. **인증이 필요하면 처음부터 credentials 흐름**으로 설계. 나중에 끼워 맞추면 헤더 누락 디버깅 지옥.

## 자주 헷갈리는 디테일

- 이미지 `<img>`나 `<script>` 태그로 가져오는 cross-origin 리소스는 **CORS 없이도 로드** 가능. 다만 canvas로 픽셀 읽기, JS로 응답 읽기 같은 건 막힘(`crossorigin` 속성 + CORS 응답 필요).
- `fetch`의 `mode: 'no-cors'`는 응답을 **opaque**로 만들어 읽지 못하게 함. 회피책이 아님.
- Service Worker, fetch from extension 등 환경에 따라 CORS 적용 범위 차이.

## 면접 follow-up

- "왜 OPTIONS가 두 번 가지 않게 하려면?" → `Access-Control-Max-Age`로 preflight 캐시.
- "공인 IP 두 개의 서버를 한 도메인으로 묶고 싶다면?" → 리버스 프록시로 같은 origin 흡수.
- "CORS와 CSP의 관계?" → 무관. CSP는 페이지가 어떤 리소스를 로드/실행할지 통제. CORS는 cross-origin 응답 읽기 통제.
