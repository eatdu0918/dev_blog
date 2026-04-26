---
published: true
type: 'qna'
level: 'mid'
title: "RESTful API를 어떤 원칙으로 설계하시나요?"
date: '2026-04-27'
categories: ['Web', 'API', 'Design']
---

## 핵심 요약

REST는 단순히 "URL을 명사로 + HTTP 메서드 사용"이 아닙니다. Roy Fielding의 원본 정의는 **6가지 제약**:

1. Client-Server
2. **Stateless**
3. Cacheable
4. Uniform Interface
5. Layered System
6. Code on Demand(선택)

면접에서는 보통 **자원 명명, 메서드 사용, 멱등성, 페이지네이션, 에러 표현** 위주로 묻습니다.

## 자원 중심 명명

- **명사 + 복수형**: `/users`, `/orders`. 동사 X.
- **계층**: `/users/{id}/orders`.
- **컬렉션 vs 단일**: `/users` vs `/users/{id}`.
- 동작 표현이 어색할 때만 RPC 스타일 허용: `/orders/{id}/cancel`.

## HTTP 메서드 매핑

| 메서드 | 용도 | 멱등 | 안전 |
|---|---|---|---|
| GET | 조회 | ✅ | ✅ |
| POST | 생성/액션 | ❌ | ❌ |
| PUT | 전체 교체 | ✅ | ❌ |
| PATCH | 부분 수정 | ❌(보통) | ❌ |
| DELETE | 삭제 | ✅ | ❌ |

- **안전(safe)**: 서버 상태 변경 X.
- **멱등(idempotent)**: 여러 번 호출해도 결과 동일.

## 멱등성 디자인

- PUT은 본문 = 최종 상태 → 멱등.
- POST는 비멱등이 기본 — **Idempotency-Key** 헤더로 보강.
- DELETE는 두 번째 호출이 404가 정상이면 멱등 깨진다는 시각도 있음(204 통일이 안전).

## 페이지네이션

세 가지 방식:
1. **Offset/Limit**: `?offset=20&limit=10`. 단순하지만 깊은 페이지 느림 + 데이터 추가 시 중복/누락.
2. **Cursor**: 마지막 항목의 키로 다음 페이지 요청. 안정적 + 빠름 + 무한 스크롤에 적합.
3. **Page/Size**: offset의 변형. 같은 단점.

대규모 시스템은 **cursor** 권장.

## 필터링/정렬/검색

- 필터: `?status=active&type=premium`.
- 정렬: `?sort=-createdAt,name` (`-`는 내림차순).
- 검색: `?q=...` 또는 별도 `/search` 엔드포인트.
- 표현 형식: 팀 컨벤션 통일.

## 에러 응답

`application/problem+json`(RFC 7807) 권장:
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

- 클라이언트가 코드로 분기할 수 있게 **에러 코드(string)** 부여.
- 메시지는 사용자/개발자 분리.

## 버전 관리

- **URL 경로**: `/v1/users`. 가장 흔함.
- **헤더**: `Accept: application/vnd.acme.v1+json`. 깔끔하지만 캐시/디버깅 어려움.
- **쿼리스트링**: `?v=1`. 비권장.

호환성:
- **Additive only**: 필드 추가는 OK, 제거/변경은 새 버전.
- 클라이언트는 모르는 필드 무시(forward compatibility).

## 인증

- 표준: **OAuth 2.0 Bearer**.
- API 키: 서버 간 단순 통신.
- 세션 쿠키: 같은 도메인 웹 클라이언트.

## HATEOAS

REST 원본의 핵심이지만 실무에서 거의 안 씀. 클라이언트가 사전에 URL 구조를 알고 있는 게 일반적.

## REST의 한계와 대안

- **Over-fetching / Under-fetching** → GraphQL.
- **고성능 RPC** → gRPC.
- **실시간** → WebSocket, SSE.
- **이벤트 기반** → 메시징(Kafka, NATS).

REST가 만능이 아님. 도메인/요구에 따라 선택.

## 자주 헷갈리는 디테일

- **POST /users/{id}/cancel** 같은 액션 엔드포인트는 REST 원칙 위반이지만 실무 타협으로 흔함.
- bulk 요청(`POST /users/batch`)은 RESTful하기 어려움. RPC 느낌이 자연스러움.
- 200 + `{"success": false}` 패턴은 모니터링/캐시 깨짐 → 상태 코드와 본문 일치.

## 면접 follow-up

- "PUT으로 부분 수정하면?" → PUT은 전체 교체 의미. 누락 필드가 null로 가버릴 수 있음. PATCH 사용.
- "REST에서 트랜잭션을?" → HTTP는 무상태라 본질적으로 어려움. saga, 이벤트 기반 보상, 또는 단일 엔드포인트로 묶음.
- "API 호환성 깨는 변경 시?" → 버전 분리 + deprecated 헤더 + sunset 기간 + 변경 가이드.
