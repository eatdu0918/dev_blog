---
published: true
type: 'qna'
level: 'mid'
title: "세션, JWT, OAuth 2.0 — 인증 방식을 어떤 기준으로 선택하시나요?"
date: '2026-04-26'
categories: ['Security', 'Backend', 'Auth']
---

## Q1. 세션 인증과 JWT의 차이는 뭔가요?

**A.** 가장 큰 차이는 **상태를 누가 갖느냐**입니다.

- **세션**: 서버가 세션 ID → 사용자 매핑을 보관. 즉시 무효화 가능, 수평 확장 시 Redis 같은 공유 스토어 필요.
- **JWT**: 서명된 토큰에 사용자 정보를 담아 클라이언트가 보관. 서버 stateless, 대신 즉시 무효화가 어렵고 만료까지 기다리거나 블랙리스트 운영.

"세션은 옛날 방식, JWT가 모던"이라는 통념은 잘못입니다. 단일 서비스에서는 세션이 단순하고 안전합니다. JWT는 마이크로서비스, 모바일, 제3자 API 같이 **서버 간 stateless 통신**이 필요할 때 가치가 큽니다.

---

## Q2. JWT를 쓸 때 운영에서 가장 신경 쓰는 부분은?

**A.** 다음 4가지입니다.

1. **Access + Refresh 분리**: Access는 짧게(15분), Refresh는 길게(2주). Refresh는 사용 시마다 **rotation**(새로 발급 + 이전 것 무효화).
2. **저장 위치**: LocalStorage는 XSS에 취약 → **HttpOnly + Secure + SameSite 쿠키** 권장.
3. **재사용 감지**: 이미 사용한 refresh 토큰이 다시 들어오면 패밀리 전체 무효화 → 탈취 의심.
4. **알고리즘 검증**: `alg=none` 공격, RS256/HS256 키 혼동을 막기 위해 라이브러리에 알고리즘 화이트리스트 명시.

---

## Q3. JWT는 암호화된 건가요?

**A.** 아닙니다. **서명(Signature)** 일 뿐 암호화가 아닙니다. payload는 base64url 인코딩이라 누구나 디코딩해서 읽을 수 있습니다. 비밀번호, 주민번호 같은 민감 정보는 절대 담으면 안 됩니다.

암호화가 필요하면 JWE(JSON Web Encryption)가 별도로 있지만 거의 안 씁니다.

---

## Q4. OAuth 2.0의 표준 흐름은 무엇인가요?

**A.** **Authorization Code + PKCE**가 현재 표준입니다.

1. 클라이언트가 인가 서버로 리다이렉트(`code_challenge` 포함).
2. 사용자가 로그인/동의하면 인가 서버가 **authorization code**를 발급.
3. 클라이언트가 `code + code_verifier`로 토큰 엔드포인트에서 access/refresh 토큰 교환.
4. 이후 access token으로 리소스 서버 호출.

Implicit flow는 폐기됐고, SPA/모바일도 PKCE를 쓰는 게 표준입니다. PKCE는 client secret을 안전하게 보관하지 못하는 환경에서 **인가 코드 가로채기**를 막아줍니다.

---

## Q5. OAuth와 OIDC의 차이는요?

**A.** OAuth 2.0은 **권한 위임(인가)** 프로토콜이지 "사용자가 누구냐"를 표준화한 게 아닙니다. 그래서 로그인 용도로 쓰려면 각자 다른 방식이 됐습니다.

OIDC(OpenID Connect)는 OAuth 위에 **ID Token(JWT)** 과 `/userinfo` 엔드포인트를 추가해 표준화한 인증 레이어입니다.

- "구글 로그인" 구현 = OIDC.
- "구글 캘린더 API 접근 위임" = OAuth.

---

## Q6. OAuth의 state와 PKCE는 다른 건가요?

**A.** 둘 다 보안 장치지만 막는 공격이 다릅니다.

- **state**: 콜백 단계의 **CSRF 방지**. 인가 시작 시 임의 값 발급, 콜백에서 검증.
- **PKCE**: 인가 코드 발급/교환 단계의 **코드 가로채기 방지**. 모바일/SPA에서 redirect URI를 가로챈 공격자가 토큰을 못 바꾸게.

둘 다 켜야 안전합니다.

---

## Q7. Refresh token rotation에서 모바일 동시성 이슈는 어떻게 처리하나요?

**A.** 두 개의 요청이 거의 동시에 만료된 access token을 보고 refresh를 시도하면, 두 번째 요청이 실패합니다(rotation으로 첫 번째에서 이미 무효화).

해결:
- **짧은 grace period**: 직전 refresh 토큰을 짧게 유효 처리.
- **single-flight**: 클라이언트에서 동시 refresh 요청을 한 개로 합치고 결과 공유.
- **재시도 + 재로그인 fallback**.

---

## Q8. SSO는 어떻게 구현하나요?

**A.** 중앙 IdP(Identity Provider)가 사용자 인증을 책임지고, 각 서비스는 IdP가 발급한 토큰을 신뢰합니다.

- **OIDC**: 모던 웹/모바일 표준.
- **SAML**: 엔터프라이즈에서 여전히 많이 쓰임. XML 기반.

서비스 간 로그인 상태 공유는 IdP에서 발급한 ID Token + 각 서비스의 자체 세션을 IdP 세션과 동기화하는 방식이 일반적입니다.
