---
published: true
type: 'qna'
level: 'mid'
title: "API 멱등성과 Rate Limiting — 어떻게 설계하시나요?"
date: '2026-04-26'
categories: ['Backend', 'API', 'Reliability']
---

## 핵심 요약

- **멱등성(Idempotency)**: 같은 요청을 N번 보내도 결과가 1번 보낸 것과 같음. 네트워크 재시도/타임아웃이 일상인 분산 환경에서 **데이터 중복 방지의 표준 도구**.
- **Rate Limiting**: 요청 빈도를 제한해 시스템을 보호하고 공정하게 분배. 알고리즘 선택과 **분산 환경에서의 정확성**이 핵심.

둘 다 "한 노드에서는 쉬운데 여러 노드/멀티 인스턴스에서 정확히 동작시키는 게 어려운" 주제입니다.

## 멱등성이 필요한 순간

- 결제, 송금, 주문 생성 — **중복이 곧 사고**.
- 네트워크 재시도, 사용자 더블 클릭, 모바일 앱이 응답 못 받고 재요청.
- HTTP 메서드의 멱등성 보장(GET/PUT/DELETE는 멱등, POST는 비멱등이 기본)은 **명세상**의 약속이지, 비즈니스 로직 차원의 보장은 별개.

## Idempotency Key 패턴 (Stripe 방식)

클라이언트가 요청마다 **고유 키(UUID)**를 헤더에 동봉.

```
POST /payments
Idempotency-Key: 7e3f2c8a-...
```

서버 처리:
1. 키로 캐시/DB 조회.
2. 이미 있으면 저장된 응답을 그대로 반환(처리 안 함).
3. 없으면 처리 + 결과를 키와 함께 저장.
4. 처리 중인 동시 요청은 락으로 직렬화 또는 "in-progress" 응답.

### 디테일

- **저장 기간**: 24~72시간이 일반적. 너무 짧으면 재시도 윈도우 부족.
- **키 + 요청 본문 해시 같이 저장**: 같은 키로 다른 본문이 오면 409 충돌. 클라이언트 버그 조기 발견.
- **응답 자체를 저장**: 두 번째 요청에 200으로 같은 응답 줘야 멱등.
- **부분 실패**: DB 트랜잭션과 키 저장을 같은 트랜잭션 안에. 외부 API 호출이 끼면 outbox 패턴.

## DB 차원의 멱등성

- **자연 키 + UNIQUE 제약**: 주문번호처럼 비즈니스 키가 있으면 DB가 중복 막아줌. 가장 단순하고 강력.
- **`INSERT ... ON CONFLICT DO NOTHING`** (PostgreSQL) / `INSERT IGNORE` (MySQL).
- **CAS(Compare-And-Set)**: 상태 전이를 `WHERE status = 'PENDING'` 조건부 UPDATE로.

## Rate Limiting 알고리즘

### Fixed Window
1분마다 카운터 리셋. 구현 단순. **경계 burst 문제**: 59초와 61초에 각각 한도만큼 가능.

### Sliding Window Log
요청 타임스탬프를 모두 저장하고 N초 윈도우 내 개수 카운트. 정확하지만 메모리 비쌈.

### Sliding Window Counter
이전 윈도우 카운터 + 현재 윈도우 카운터를 비율로 합산. 메모리 효율 + 정확도 절충. **가장 자주 쓰임**.

### Token Bucket
일정 속도로 토큰 충전, 요청마다 토큰 소비. **버스트 허용 + 평균 속도 제한**. AWS, GCP API 등.

### Leaky Bucket
큐에 들어와 일정 속도로 빠짐. 부드러운 출력 보장. 트래픽 평탄화 목적.

## 분산 환경의 어려움

여러 인스턴스가 카운터를 공유해야 정확. 보통 **Redis**.

- **`INCR + EXPIRE`** 조합: 흔한 시작점. 다만 INCR과 EXPIRE 사이 race 존재. **Lua 스크립트 또는 SET ... NX EX**로 원자화.
- **Redis Cluster의 키 분산**: 사용자별 키는 자연스럽게 샤딩되지만, 글로벌 한도는 한 키에 집중 → 핫 키.
- **시간 동기화**: 노드 간 시계 차이로 윈도우 경계 어긋날 수 있음. NTP 필수.

## 어디서 적용하나

- **API Gateway / 리버스 프록시(Nginx, Envoy, Kong)**: 가장 앞단에서 차단. 인프라 보호.
- **애플리케이션 미들웨어**: 사용자/엔드포인트별 비즈니스 한도.
- **사용자 단위 / IP 단위 / API 키 단위** 등 다층 적용. IP만 쓰면 NAT 사용자 다수에게 영향.

## 응답 정책

- **429 Too Many Requests** + **`Retry-After`** 헤더(초 또는 HTTP-date).
- 헤더로 한도/잔여/리셋 시점 노출(`X-RateLimit-Limit`, `Remaining`, `Reset`).
- 클라이언트는 **exponential backoff + jitter**로 재시도. 모두 같은 시각에 재시도하면 thundering herd.

## 자주 헷갈리는 디테일

- "PUT은 멱등이라 안전하다" → 명세상은 그렇지만 **서버가 PATCH 의미로 구현**하면 깨짐. 표준만 믿지 말고 비즈니스 로직 검증.
- 멱등성 키와 트랜잭션 ID는 다름. 트랜잭션 ID는 시스템이 부여, 멱등성 키는 **클라이언트가 결정**.
- Rate Limit는 **DDoS 방어가 아님**. 분산 공격은 별도 솔루션(WAF, CDN, anycast).

## 면접 follow-up

- "결제 API에서 동시 두 번 요청이 들어오면?" → 키 기반 락(Redis SETNX) 또는 DB UNIQUE 제약으로 직렬화. 이미 처리된 응답 반환.
- "Token Bucket과 Sliding Window의 선택?" → 버스트 허용 여부. 광고 입찰처럼 짧은 폭발 트래픽이 정상이면 Token Bucket.
- "Rate limit 한도를 초과해 차단했는데 사용자 항의가 들어오면?" → 화이트리스트, 가중치, 사용자 등급별 한도. 무엇보다 **로그/메트릭으로 차단 이유 추적**이 가능해야 함.
