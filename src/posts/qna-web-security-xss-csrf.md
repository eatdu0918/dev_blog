---
published: true
type: 'qna'
level: 'mid'
title: "XSS와 CSRF의 차이를 설명하고, 각각을 어떻게 방어하시나요?"
date: '2026-04-26'
categories: ['Security', 'Web', 'Frontend']
---

## 핵심 요약

- **XSS**: 공격자가 **희생자의 브라우저에서 임의 스크립트를 실행**시키는 공격. 본질은 "신뢰할 수 없는 입력의 코드 실행".
- **CSRF**: 희생자의 **브라우저에 이미 있는 인증 정보로 의도하지 않은 요청을 보내게** 만드는 공격. 본질은 "요청자가 의도한 사용자인지 확인 부재".

두 공격은 자주 같이 등장하지만 방어 메커니즘이 다릅니다.

## XSS 방어

XSS는 보통 세 종류로 나뉩니다(Stored, Reflected, DOM-based). 방어는 출력 시점이 핵심입니다.

- **출력 시 escape**: HTML, attribute, JS, URL 컨텍스트마다 escape 규칙이 다릅니다. 직접 짜지 말고 프레임워크가 제공하는 안전한 출력 방식을 따릅니다(React JSX는 기본 escape, `dangerouslySetInnerHTML`만 위험).
- **CSP(Content Security Policy)**: `script-src 'self'`로 인라인 스크립트 차단, 사고가 나도 피해 범위를 좁히는 마지막 방어선.
- **innerHTML / eval / Function() 금지**: 신뢰할 수 없는 데이터를 코드로 바꾸는 모든 경로 차단.
- **Sanitize 라이브러리**: 사용자 HTML을 허용해야 한다면 DOMPurify 등으로 화이트리스트 기반 정제.
- **HttpOnly 쿠키**: 인증 토큰을 JS로 못 읽게. XSS가 뚫려도 토큰 탈취 한 단계를 막아줍니다.

## CSRF 방어

CSRF는 **다른 사이트에서 fire-and-forget로 보낸 요청에 브라우저가 자동으로 쿠키를 동봉**하는 게 본질입니다. 방어는 "요청 출처가 정말 우리 사이트인지" 검증입니다.

- **SameSite 쿠키**: `SameSite=Lax`(기본값으로 정착)면 외부 사이트에서 보낸 POST에는 쿠키가 안 실립니다. 가장 강력한 1차 방어.
- **CSRF 토큰**: 서버가 발급한 임의 토큰을 폼/헤더에 실어 검증. SPA + REST API에서는 보통 헤더(`X-CSRF-Token`).
- **Origin / Referer 검증**: 도메인이 다른 요청 차단.
- **Custom Header + CORS**: 브라우저는 단순 요청이 아닌 `application/json` + 커스텀 헤더 요청에 preflight를 강제. CORS 설정만 잘하면 외부에서 보낸 fetch가 막힙니다.

JWT를 LocalStorage에 두는 방식은 **CSRF는 약하지만 XSS에는 매우 취약**합니다. 쿠키 기반(HttpOnly + SameSite)이 둘 다를 동시에 다루기 좋아 권장됩니다.

## 자주 헷갈리는 디테일

- **CORS는 보안 도구가 아닙니다**. 브라우저가 의도치 않은 cross-origin 접근을 막는 정책일 뿐. 서버는 여전히 인증/인가를 직접 해야 합니다.
- **HTTPS만으로는 XSS/CSRF를 막지 못합니다**. HTTPS는 전송 보안.
- **XSS가 뚫리면 CSRF 방어가 다 무용**해집니다. 같은 origin에서 코드가 실행되므로 토큰이든 SameSite 쿠키든 그대로 사용 가능. 그래서 XSS 방어가 가장 우선입니다.

## React/Next.js 환경에서의 체크포인트

- `dangerouslySetInnerHTML` 사용처는 PR 리뷰에서 항상 짚는 항목.
- 마크다운 렌더링 시 sanitize 단계 필수.
- 외부 URL을 `<a href={url}>`에 넣을 때 `javascript:` 스키마 검증.
- 동적 스타일을 inline으로 받으면 `style` 속성 인젝션 가능성.
- Next.js의 `next/image`처럼 SSR로 들어오는 사용자 입력에도 같은 escape 규칙 적용.

## 면접 follow-up

- "Stored XSS와 Reflected XSS의 차이는?" → 영속화 여부. Stored가 피해 범위가 큽니다(모든 방문자).
- "CSP를 도입할 때 어려운 점?" → 기존 인라인 스크립트/스타일 정리, 외부 리소스 도메인 화이트리스트 관리, nonce/hash 운영. 점진적으로 `report-only`로 시작.
- "OAuth state 파라미터의 역할?" → CSRF 방지. 인증 시작 시 state 발급, 콜백에서 검증.
