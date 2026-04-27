---
published: true
type: 'qna'
level: 'mid'
title: "XSS와 CSRF의 차이를 설명하고, 각각을 어떻게 방어하시나요?"
date: '2026-04-26'
categories: ['Security', 'Web', 'Frontend']
---

## Q1. XSS와 CSRF의 본질적 차이는 뭔가요?

**A.**
- **XSS**: 공격자가 **희생자의 브라우저에서 임의 스크립트를 실행**. 본질은 "신뢰할 수 없는 입력의 코드 실행".
- **CSRF**: 희생자의 **브라우저에 이미 있는 인증 정보로 의도하지 않은 요청**을 보내게 만듦. 본질은 "요청자가 의도한 사용자인지 확인 부재".

두 공격은 자주 같이 등장하지만 방어 메커니즘이 다릅니다.

---

## Q2. XSS의 종류는 어떻게 나뉘나요?

**A.** 3가지입니다.

- **Stored XSS**: DB에 저장된 악성 스크립트를 다른 사용자가 조회. 피해 범위 가장 큼.
- **Reflected XSS**: URL/요청 파라미터의 스크립트가 응답에 반영. 피싱 링크와 결합.
- **DOM-based XSS**: 서버 응답이 아닌 클라이언트 JS에서 DOM 조작 시 발생.

방어는 모두 **출력 시점에 적절히 escape**가 핵심입니다.

---

## Q3. XSS는 어떻게 방어하시나요?

**A.** 5가지 layered defense입니다.

1. **출력 시 컨텍스트별 escape**: 직접 짜지 말고 프레임워크에 맡김. React JSX는 기본 escape, `dangerouslySetInnerHTML`만 위험.
2. **CSP(Content Security Policy)**: `script-src 'self'`로 인라인 스크립트 차단. 마지막 방어선.
3. **innerHTML / eval / Function() 금지**: 신뢰할 수 없는 데이터를 코드로 바꾸는 경로 차단.
4. **Sanitize 라이브러리**: 사용자 HTML 허용 시 DOMPurify로 화이트리스트 정제.
5. **HttpOnly 쿠키**: 인증 토큰을 JS로 못 읽게.

---

## Q4. CSRF는 어떻게 방어하시나요?

**A.** 4가지 방어선이 있습니다.

1. **SameSite 쿠키**: `SameSite=Lax`(기본)면 외부 사이트 POST에 쿠키 안 실림. **가장 강력한 1차 방어**.
2. **CSRF 토큰**: 서버가 발급한 임의 토큰을 폼/헤더에 실어 검증. SPA에서는 보통 `X-CSRF-Token` 헤더.
3. **Origin / Referer 검증**: 도메인이 다른 요청 차단.
4. **Custom Header + CORS**: `application/json` + 커스텀 헤더 요청에 preflight 강제 → 외부 fetch 차단.

---

## Q5. JWT를 LocalStorage에 저장하는 게 왜 위험한가요?

**A.** **XSS가 뚫리면 토큰 탈취가 즉시 가능**해집니다.

- LocalStorage: JS로 자유 접근.
- HttpOnly 쿠키: JS로 못 읽음.

`document.cookie`에 토큰 저장도 같은 위험. **HttpOnly + Secure + SameSite 쿠키** 조합이 둘 다(XSS와 CSRF) 다루기 좋아 권장됩니다.

---

## Q6. CORS로 CSRF를 막을 수 있나요?

**A.** **부분적으로**입니다.

- CORS는 cross-origin **응답 읽기**를 막을 뿐 요청 자체를 막진 않음.
- 다만 `application/json` + 커스텀 헤더는 preflight가 강제되어 외부 단순 fetch는 막힘.
- CSRF 방어의 **본책임은 SameSite + 토큰 + Origin 검증**.

CORS만 믿으면 안 됩니다.

---

## Q7. CSP를 도입할 때 어려운 점은?

**A.** 4가지입니다.

- **기존 인라인 스크립트/스타일 제거**: `<script>console.log(1)</script>` 같은 코드 다 정리.
- **외부 리소스 도메인 화이트리스트**: 광고/분석 도메인까지 명시.
- **nonce/hash 운영**: 동적 스크립트는 매번 nonce 생성 필요.
- **점진 도입**: `Content-Security-Policy-Report-Only`로 위반만 리포트하면서 점진 강화.

큰 사이트는 CSP 도입에 수개월이 걸리기도 합니다.

---

## Q8. XSS와 CSRF 중 무엇이 더 위험한가요?

**A.** **XSS가 훨씬 위험**합니다.

이유:
- XSS가 뚫리면 **CSRF 방어가 무용**해짐. 같은 origin에서 코드가 실행되므로 토큰/SameSite 쿠키를 모두 우회 가능.
- 토큰 탈취, 키로깅, 화면 위조까지 가능.

그래서 보안 우선순위는 **XSS 방어 → CSRF 방어** 순입니다.

---

## Q9. React/Next.js 환경에서 보안 체크포인트는?

**A.** 5가지입니다.

- **`dangerouslySetInnerHTML` 사용처**는 PR 리뷰에서 항상 검토.
- **마크다운 렌더링 시 sanitize 필수**(DOMPurify, rehype-sanitize).
- **`<a href={url}>`** 에 외부 URL 들어갈 때 `javascript:` 스키마 검증.
- **inline style** 속성 인젝션 가능성.
- **SSR로 들어오는 사용자 입력**도 같은 escape 규칙 적용.

`next/image`도 사용자 입력을 신뢰하면 안 됩니다.

---

## Q10. OAuth의 state 파라미터는 어떤 역할인가요?

**A.** **CSRF 방지**입니다.

- 인증 시작 시 클라이언트가 임의 state 생성 + 세션에 저장.
- 인증 콜백에서 받은 state와 세션의 state 비교.
- 일치하지 않으면 공격자가 콜백 URL을 위조한 것 → 거부.

OAuth state 검증 누락은 흔한 보안 사고입니다. PKCE와 함께 둘 다 필수입니다(state는 콜백 단계 CSRF, PKCE는 인가 코드 가로채기 방어 — 역할이 다릅니다).
