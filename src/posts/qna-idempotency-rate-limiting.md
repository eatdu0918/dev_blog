---
published: true
type: 'qna'
level: 'mid'
title: "API 멱등성과 Rate Limiting — 어떻게 설계하시나요?"
date: '2026-04-26'
categories: ['Backend', 'API', 'Reliability']
---

## Q1. API 멱등성이 왜 필요한가요?

**A.** **네트워크 재시도/타임아웃이 일상인 분산 환경에서 데이터 중복을 막는 표준 도구**이기 때문입니다.

흔한 시나리오:
- 결제 요청 후 응답을 못 받아 클라이언트가 재시도.
- 사용자가 결제 버튼 더블 클릭.
- 모바일 앱이 네트워크 끊김 후 자동 재시도.

HTTP 메서드의 멱등성(GET/PUT/DELETE는 멱등)은 **명세상 약속**이고, 비즈니스 로직 차원의 보장은 별도로 설계해야 합니다.

---

## Q2. Idempotency Key 패턴은 어떻게 동작하나요?

**A.** **Stripe 방식**이 표준입니다. 클라이언트가 요청마다 고유 키(UUID)를 헤더에 동봉.

```
POST /payments
Idempotency-Key: 7e3f2c8a-...
```

서버 처리:
1. 키로 캐시/DB 조회.
2. 이미 있으면 저장된 응답 그대로 반환.
3. 없으면 처리 + 결과를 키와 함께 저장.
4. 처리 중인 동시 요청은 락으로 직렬화.

---

## Q3. Idempotency Key 운영 디테일은 어떻게 챙기나요?

**A.** 4가지를 신경 씁니다.

- **저장 기간**: 24~72시간 일반적. 너무 짧으면 재시도 윈도우 부족.
- **키 + 요청 본문 해시 함께 저장**: 같은 키로 다른 본문이 오면 409. 클라이언트 버그 조기 발견.
- **응답 저장**: 두 번째 요청에 200 + 같은 응답 반환해야 진짜 멱등.
- **트랜잭션 경계**: DB 트랜잭션과 키 저장을 같은 트랜잭션 안에. 외부 API 호출이 끼면 outbox 패턴.

---

## Q4. DB 차원에서 멱등성을 보장하는 방법도 있나요?

**A.** 네. 자주 쓰는 패턴:

- **자연 키 + UNIQUE 제약**: 주문번호 같은 비즈니스 키가 있으면 DB가 자동 차단. 가장 단순하고 강력.
- **`INSERT ... ON CONFLICT DO NOTHING`** (PostgreSQL), `INSERT IGNORE` (MySQL).
- **CAS(Compare-And-Set)**: `WHERE status = 'PENDING'` 조건부 UPDATE로 상태 전이를 원자화.

키 기반 캐시와 DB UNIQUE를 같이 쓰는 것이 안전합니다.

---

## Q5. Rate Limiting 알고리즘 중 무엇을 자주 쓰시나요?

**A.** **Sliding Window Counter**가 가장 자주 쓰이고, 버스트 허용이 필요하면 **Token Bucket**.

- **Fixed Window**: 1분마다 리셋. 단순하지만 경계 burst 문제(59초 + 61초 두 번 한도만큼).
- **Sliding Window Log**: 정확하지만 타임스탬프 모두 저장 — 메모리 비쌈.
- **Sliding Window Counter**: 이전+현재 윈도우 카운터를 비율로 합산. 효율 + 정확 절충.
- **Token Bucket**: 일정 속도 토큰 충전, 요청 시 소비. 버스트 허용 + 평균 속도 제한.
- **Leaky Bucket**: 큐 + 일정 속도 처리. 트래픽 평탄화.

---

## Q6. 분산 환경에서 Rate Limit을 어떻게 정확하게 구현하나요?

**A.** **Redis + Lua 스크립트**로 원자화합니다.

문제: `INCR` 후 `EXPIRE` 사이에 race condition. 

해결:
- **Lua 스크립트**: 두 명령을 원자 실행.
- 또는 `SET key value NX EX seconds`로 한 번에.
- 글로벌 한도는 한 키에 집중되어 hot key 위험 → 사용자/슬롯 분산.
- 노드 간 시계 차이 주의 → NTP 필수.

---

## Q7. Rate Limit을 어디 계층에 적용하시나요?

**A.** 다층 적용이 정석입니다.

- **API Gateway / 리버스 프록시(Nginx, Envoy, Kong)**: 앞단에서 차단. 인프라 보호.
- **애플리케이션 미들웨어**: 사용자/엔드포인트별 비즈니스 한도.
- **단위**: 사용자 ID, API 키, IP 다층. IP만 쓰면 NAT 뒤 다수 사용자가 같이 차단됩니다.

---

## Q8. 429 응답에 무엇을 포함해야 하나요?

**A.** 클라이언트가 적절히 대응할 수 있게 정보를 줍니다.

- **상태 코드**: `429 Too Many Requests`.
- **`Retry-After`**: 초 또는 HTTP-date.
- **`X-RateLimit-Limit / Remaining / Reset`**: 한도, 잔여, 리셋 시각.
- 본문에 에러 코드/메시지.

클라이언트는 **exponential backoff + jitter**로 재시도해야 합니다. 모두 같은 시점에 재시도하면 thundering herd.

---

## Q9. Rate Limit으로 DDoS도 막을 수 있나요?

**A.** **거의 못 막습니다**. Rate Limit은 정상 트래픽의 공정 분배 도구지 DDoS 방어 솔루션이 아닙니다.

분산 공격은 IP가 분산되어 사용자 단위로 쏟아져 들어오므로 일반 rate limit이 무력합니다. 별도 솔루션이 필요:
- **WAF**(Cloudflare, AWS WAF).
- **anycast CDN**으로 트래픽 분산.
- **봇 차단**(reCAPTCHA, 행동 분석).
