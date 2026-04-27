---
published: true
type: 'qna'
level: 'mid'
title: "CORS는 어떻게 동작하고, 왜 자꾸 막히나요?"
date: '2026-04-26'
categories: ['Web', 'Security', 'Network']
---

## Q1. CORS는 무엇이고 왜 존재하나요?

**A.** **CORS는 보안 메커니즘이 아니라 SOP(Same-Origin Policy)를 완화하는 규약**입니다. 그리고 막는 건 서버가 아니라 **브라우저**입니다.

서버는 응답을 정상적으로 보냈고, 브라우저가 다른 origin의 JS가 그 응답을 못 읽게 차단할 뿐입니다. 그래서 같은 요청이 curl/Postman에서는 되고 브라우저에서만 막힙니다.

Origin = `scheme + host + port` 셋 중 하나라도 다르면 cross-origin입니다. `https://a.com`과 `https://api.a.com`도 다른 origin입니다.

---

## Q2. 단순 요청과 Preflight의 차이가 뭔가요?

**A.** 브라우저가 두 종류로 분기합니다.

**단순 요청**: GET/HEAD/POST + 제한된 Content-Type(`text/plain`, `urlencoded`, `multipart/form-data`) + 커스텀 헤더 없음. 바로 본 요청을 보냅니다.

**Preflight**: 위 조건을 벗어나면 본 요청 전에 `OPTIONS`로 사전 허가를 확인합니다. 응답에 `Access-Control-Allow-Origin/Methods/Headers`가 있어야 본 요청 진행.

`Authorization` 헤더, `application/json` body는 거의 항상 preflight를 트리거합니다.

---

## Q3. Preflight가 매 요청마다 가서 느려졌습니다. 어떻게 줄이나요?

**A.** `Access-Control-Max-Age` 헤더로 preflight 응답을 캐시합니다. 보통 600~86400초.

```
Access-Control-Max-Age: 86400
```

이러면 같은 origin/메서드/헤더 조합에 대해 24시간 동안 OPTIONS가 안 날아갑니다.

---

## Q4. 쿠키나 인증 헤더를 같이 보내려면 무엇을 설정해야 하나요?

**A.** 양쪽 다 명시해야 합니다.

- **클라이언트**: `fetch(url, { credentials: 'include' })`.
- **서버**: `Access-Control-Allow-Credentials: true` + **`Access-Control-Allow-Origin`은 와일드카드 금지**, 정확한 origin 반환.

`Allow-Origin: *` + credentials 조합은 브라우저가 거부합니다. 가장 흔한 실수 1순위입니다. 동적으로 origin을 반환할 때는 `Vary: Origin` 헤더를 같이 줘서 캐시 오염을 막습니다.

---

## Q5. CORS 에러가 나는데 실제 원인을 못 찾는 경우는?

**A.** 거의 항상 5가지 중 하나입니다.

1. **에러 응답(4xx/5xx)에 CORS 헤더 누락** → 브라우저는 "CORS 에러"로 보고하지만 실제 원인은 서버 에러.
2. **프록시/CDN이 OPTIONS를 가로챔** → 백엔드까지 도달 못 함.
3. **리다이렉트 응답 + preflight** → preflight에 redirect는 금지.
4. **credentials + 와일드카드 origin** → 자동 거부.
5. DevTools Network 탭에서 preflight 안 보여서 헤맴 → "All" 또는 "Other" 필터로 확인.

---

## Q6. CORS로 CSRF를 막을 수 있나요?

**A.** **부분적으로**입니다. CORS는 "다른 origin의 JS가 응답을 읽는 것"을 막을 뿐, 요청 자체를 막지 않습니다. 

다만 `application/json` + 커스텀 헤더 요청은 preflight가 강제되므로 외부 사이트의 단순 fetch는 막힙니다. 그래도 CSRF 방어의 본책임은 **SameSite 쿠키, CSRF 토큰, Origin/Referer 검증**입니다. CORS만 믿으면 안 됩니다.

---

## Q7. 실무에서 CORS 문제를 어떻게 깔끔하게 해결하시나요?

**A.** 우선순위로 4가지를 시도합니다.

1. **같은 origin으로 통합**: 리버스 프록시(Nginx) 또는 Next.js API routes로 프론트/백엔드를 한 도메인에. CORS 자체가 사라짐.
2. **개발 환경 프록시**: Vite/CRA의 `proxy` 옵션으로 dev 서버가 백엔드로 포워딩.
3. **명시적 origin 화이트리스트**: 운영은 환경변수로 관리.
4. **인증이 필요하면 처음부터 credentials 흐름** 으로 설계. 나중에 끼워 맞추면 디버깅 지옥.

---

## Q8. CORS와 CSP는 다른 건가요?

**A.** 무관합니다.

- **CORS**: cross-origin 응답을 JS가 읽는 것을 통제.
- **CSP(Content-Security-Policy)**: 페이지가 어떤 리소스를 로드/실행할지 통제(XSS 방어).

둘 다 보안 헤더지만 막는 대상이 다릅니다. CSP는 `script-src`, `connect-src` 등으로 화이트리스트를 정합니다.

---

## Q9. `mode: 'no-cors'`로 fetch하면 CORS를 우회할 수 있나요?

**A.** **아니요.** 회피책이 아닙니다. `no-cors`는 응답을 opaque로 만들어 JS가 본문을 읽을 수 없게 합니다. Service Worker가 캐시하는 정도의 용도지 일반 fetch에는 거의 의미가 없습니다.

진짜 해결은 서버에 CORS 헤더를 추가하거나, 같은 origin으로 통합하는 것입니다.
