---
published: true
type: 'qna'
level: 'mid'
title: "세션, JWT, OAuth 2.0 — 인증 방식을 어떤 기준으로 선택하시나요?"
date: '2026-04-26'
categories: ['Security', 'Backend', 'Auth']
---

## 핵심 요약

- **세션**: 서버가 상태(세션 ID → 사용자)를 저장. **즉시 무효화 가능**, 수평 확장 시 세션 스토어 필요.
- **JWT**: 서명된 토큰에 사용자 정보 포함. **Stateless**, 즉시 무효화가 어려움.
- **OAuth 2.0 / OIDC**: "내가 누구인지(인증)"가 아닌 "이 서비스가 다른 서비스에 내 권한 일부를 위임받음(인가)" 프로토콜. 로그인은 OIDC가 그 위에 얹어 해결.

세 개념이 섞여서 면접에서 헷갈리는 답이 자주 나옵니다. 세션/JWT는 **자격 증명을 어떻게 표현/저장하는가**, OAuth는 **인증 흐름** 차원입니다.

## 세션 vs JWT

| 항목 | 세션 | JWT |
|---|---|---|
| 상태 | 서버 보관 | 클라이언트 보관 |
| 무효화 | 즉시(스토어 삭제) | 만료까지 대기 또는 블랙리스트 |
| 스케일 | Redis 같은 공유 스토어 필요 | 서버 stateless |
| 페이로드 | 세션 ID만 | 사용자 정보, 권한 등 |
| 보안 사고 시 | 토큰 즉시 회수 가능 | 회수 어려움(짧은 만료 + refresh로 보완) |

**현실 권장**: 단일 서비스라면 세션이 충분히 좋습니다. JWT는 마이크로서비스/모바일/제3자 API 같이 **서버 간 stateless 통신**이 필요할 때 가치가 큽니다. "세션 = 옛날 방식, JWT = 모던"은 잘못된 통념.

## JWT 운영의 디테일

- **Access Token + Refresh Token 분리**: Access는 짧게(15분), Refresh는 길게(2주) + **rotation**(refresh 사용 시마다 새로 발급, 이전 것 무효화).
- **저장 위치**: LocalStorage = XSS에 취약. 권장은 **HttpOnly + Secure + SameSite 쿠키**.
- **Refresh Token 재사용 감지**: 이미 사용된 refresh가 다시 들어오면 토큰 패밀리 전체를 무효화 → 탈취 의심.
- **알고리즘**: `none` / `HS256` 키 혼동(`alg=none` 공격, RS256 키를 HS256으로 검증) 주의. 라이브러리 기본값과 화이트리스트 명시.
- **블랙리스트**: 즉시 무효화가 필요하면 결국 서버 상태가 생깁니다(= JWT의 stateless 장점 일부 포기).

## OAuth 2.0 핵심 흐름 (Authorization Code + PKCE)

1. 클라이언트가 인가 서버로 리다이렉트(`code_challenge` 포함).
2. 사용자 로그인/동의 → 인가 서버가 **authorization code**를 클라이언트에 발급.
3. 클라이언트가 `code + code_verifier`로 토큰 엔드포인트에 access/refresh 요청.
4. 이후 access token으로 리소스 서버 호출.

- **PKCE**: SPA/모바일같이 client secret을 안전하게 보관 못하는 환경에서 인가 코드 가로채기 방어. 이제는 confidential client에도 권장.
- **Implicit flow는 폐기**. Authorization Code + PKCE가 표준.
- **state 파라미터**: CSRF 방지. 인가 시작 시 발급, 콜백에서 검증.

## OIDC = OAuth + 인증

- OAuth는 **권한 위임** 프로토콜이라 "누구인가"는 표준화돼 있지 않습니다.
- OIDC는 OAuth 위에 **ID Token(JWT)**과 `userinfo` 엔드포인트를 추가해 **로그인** 용도로 쓸 수 있게 한 표준.
- "구글 로그인" 구현은 OIDC. "구글 캘린더 API 접근"은 OAuth.

## 자주 헷갈리는 디테일

- JWT는 **암호화가 아니라 서명**입니다(JWE는 별개). payload는 base64url일 뿐 누구나 읽음 → 비밀번호/PII 넣지 말 것.
- "JWT는 무조건 stateless"는 환상. 즉시 로그아웃, 권한 변경 즉시 반영을 원하면 어차피 서버 조회가 들어갑니다.
- 쿠키 인증 = 세션은 아닙니다. 쿠키에 JWT를 담는 구성도 흔합니다.

## 면접 follow-up

- "Refresh token rotation에서 동시성 이슈는?" → 모바일에서 두 요청이 동시에 refresh 시도 시 두 번째가 실패. 짧은 grace period나 single-use 잠금 필요.
- "OAuth state vs PKCE 차이?" → state = 콜백 단계 CSRF, PKCE = 인가 코드 가로채기. 역할이 다릅니다.
- "SSO를 어떻게 구현하나?" → 중앙 IdP(Identity Provider)에서 OIDC ID Token 발급 → 각 서비스가 신뢰. SAML이 엔터프라이즈에서 여전히 많이 쓰임.
