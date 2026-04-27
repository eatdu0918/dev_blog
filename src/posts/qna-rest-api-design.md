---
published: true
type: 'qna'
level: 'mid'
title: "RESTful API를 어떤 원칙으로 설계하시나요?"
date: '2026-04-27'
categories: ['Web', 'API', 'Design']
---

## Q1. RESTful API의 핵심 원칙은 무엇인가요?

**A.** Roy Fielding의 원본 정의는 6가지 제약입니다.

1. Client-Server.
2. **Stateless**.
3. Cacheable.
4. Uniform Interface.
5. Layered System.
6. Code on Demand(선택).

면접에서는 단어 외우기보다 **자원 명명, 메서드 사용, 멱등성, 페이지네이션, 에러 표현**을 어떻게 설계하는지로 답하는 게 좋습니다.

---

## Q2. URL은 어떤 원칙으로 설계하시나요?

**A.**

- **명사 + 복수형**: `/users`, `/orders`. 동사 X.
- **계층 표현**: `/users/{id}/orders`.
- **컬렉션 vs 단일**: `/users` vs `/users/{id}`.
- 동작 표현이 어색할 때는 RPC 스타일 허용: `/orders/{id}/cancel`.

엄격한 REST에서는 액션 엔드포인트가 위반이지만, 실무에서는 의미가 명확한 쪽으로 타협합니다.

---

## Q3. HTTP 메서드는 어떻게 매핑하시나요?

**A.**

| 메서드 | 용도 | 멱등 | 안전 |
|---|---|---|---|
| GET | 조회 | ✅ | ✅ |
| POST | 생성/액션 | ❌ | ❌ |
| PUT | 전체 교체 | ✅ | ❌ |
| PATCH | 부분 수정 | ❌(보통) | ❌ |
| DELETE | 삭제 | ✅ | ❌ |

- **안전**: 서버 상태 변경 X.
- **멱등**: 여러 번 호출해도 결과 동일.

---

## Q4. PUT으로 부분 수정하면 안 되나요?

**A.** 안 됩니다. **PUT은 전체 교체** 의미라 누락 필드가 null로 가버릴 수 있습니다.

```
PUT /users/1
{ "name": "kim" }  // email, phone이 누락 → null로 덮어쓸 위험
```

부분 수정은 **PATCH**:
```
PATCH /users/1
{ "name": "kim" }  // 보낸 필드만 변경
```

서버 구현 시에도 PUT은 명세상 전체 교체로 동작하게 짜는 게 표준입니다.

---

## Q5. 페이지네이션은 어떤 방식을 쓰시나요?

**A.** 데이터 크기와 사용 패턴에 따라 다릅니다.

- **Offset/Limit**: `?offset=20&limit=10`. 단순하지만 **깊은 페이지가 느리고**, 데이터 추가 시 중복/누락.
- **Cursor**: 마지막 항목의 키로 다음 페이지 요청. 안정적 + 빠름 + 무한 스크롤에 적합.
- **Page/Size**: offset의 변형. 같은 단점.

대규모 시스템은 **cursor**가 정공법입니다. Offset은 1만 행 정도까지만 무난.

---

## Q6. 에러 응답은 어떤 형식으로 주시나요?

**A.** **RFC 7807 Problem Details**(`application/problem+json`)를 권장합니다.

```json
{
  "type": "https://example.com/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "detail": "email is invalid",
  "instance": "/users",
  "errors": [{ "field": "email", "code": "format" }]
}
```

핵심:
- **에러 코드(string)** 부여 → 클라이언트가 코드로 분기.
- **사용자 메시지와 개발자 메시지 분리**.
- **상태 코드와 본문 일치** — 200 + `{"success": false}` 패턴은 안티패턴.

---

## Q7. API 버전 관리는 어떻게 하시나요?

**A.** 3가지 방식이 있고 각각 트레이드오프가 있습니다.

- **URL 경로**(`/v1/users`): 가장 흔함. 캐시/디버깅 쉬움. 호환 깨면 v2로.
- **헤더**(`Accept: application/vnd.acme.v1+json`): 깔끔하지만 캐시/디버깅 어려움.
- **쿼리스트링**(`?v=1`): 비권장.

호환성 원칙:
- **Additive only**: 필드 추가는 OK, 제거/변경은 새 버전.
- 클라이언트는 **모르는 필드 무시**(forward compatibility).

---

## Q8. 멱등성을 보장하기 위한 설계는?

**A.** 메서드별로 다릅니다.

- **PUT**: 본문 = 최종 상태이므로 자연 멱등.
- **POST**: 비멱등이 기본 → **`Idempotency-Key`** 헤더로 보강.
- **DELETE**: 두 번째 호출이 404가 정상이면 멱등 논쟁이 있음 → 204 통일이 안전.

POST 결제처럼 중복이 사고로 직결되는 경우 idempotency-key 패턴이 필수입니다.

---

## Q9. REST가 적합하지 않은 시나리오는?

**A.** 4가지 경우입니다.

- **Over-fetching / Under-fetching**: 클라이언트마다 필요한 필드가 다른 경우 → **GraphQL**.
- **고성능 RPC**: 서버 간 통신 + 타입 안전 + 양방향 스트림 → **gRPC**.
- **실시간 양방향**: 채팅, 게임, 알림 → **WebSocket / SSE**.
- **이벤트 기반 비동기**: 마이크로서비스 사이 → **Kafka, NATS**.

REST는 자원 중심 CRUD에 잘 맞지만 만능이 아닙니다.

---

## Q10. REST에서 다중 자원 트랜잭션은 어떻게 처리하시나요?

**A.** HTTP가 무상태라 **본질적으로 어렵습니다**. 3가지 접근:

1. **단일 엔드포인트로 묶기**: 트랜잭션 단위를 한 요청으로 — `/orders` 생성 시 결제 + 재고 차감을 한 번에.
2. **Saga 패턴**: 여러 단계 + 보상 트랜잭션. 비동기 흐름.
3. **이벤트 기반**: REST는 진입점만, 내부는 메시징.

REST 자체로 분산 트랜잭션을 구현하려 하면 길을 잃기 쉽습니다. 도메인 경계와 트랜잭션 경계를 어떻게 묶을지가 더 본질적인 결정입니다.
