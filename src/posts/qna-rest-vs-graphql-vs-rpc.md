---
published: true
type: 'qna'
level: 'mid'
title: "API를 설계할 때 REST, GraphQL, gRPC 중 무엇을 선택하시나요?"
date: '2026-04-26'
categories: ['API', 'Architecture', 'Backend']
---

## 핵심 요약

- **REST**: 디폴트. 표준화 잘 되어 있고 캐시, 도구, 학습 비용이 가장 낮음.
- **GraphQL**: 클라이언트가 다양하고(웹+모바일+서드파티) under/over-fetching이 실제 문제일 때.
- **gRPC**: 서비스 간 내부 통신. 성능, 스키마, 코드젠이 중요할 때.

세 개를 한 시스템에 같이 쓰는 경우도 흔합니다(외부는 REST, 내부는 gRPC, 모바일 앞단은 GraphQL BFF).

## REST가 디폴트인 이유

- HTTP의 캐시(브라우저, CDN, reverse proxy)를 그대로 활용 가능.
- OpenAPI로 스키마 표준화, 코드젠 도구가 풍부.
- 디버깅이 쉬움. curl로 그냥 됨.
- 클라이언트의 학습 곡선이 낮고 서드파티에 노출하기 좋음.

대부분의 경우 "특별한 이유가 없다면 REST"가 맞는 디폴트입니다. REST의 약점이 명확히 드러날 때만 다른 선택지를 검토합니다.

## GraphQL이 정당화되는 시점

다음이 동시에 보일 때만 도입을 권합니다.

- 클라이언트가 매우 다양하고 화면마다 필요한 필드가 다름(웹/모바일/서드파티 등).
- 한 화면을 그리려고 REST 엔드포인트 5~10개를 호출하고 있음.
- 백엔드가 BFF(Backends for Frontends) 패턴을 받쳐줄 여력이 있음.

장점은 over/under-fetching 해소이지만 비용도 큽니다.

- N+1 쿼리: 데이터 로더(DataLoader) 패턴 강제.
- 캐시: HTTP 캐시를 그대로 못 씀(보통 POST + 쿼리 본문). Apollo client 캐시나 persisted query로 우회.
- 권한: 필드 단위 인가가 필요해 복잡해짐.
- 모니터링: 한 엔드포인트로 들어오는 다양한 쿼리를 어떻게 분류할지 별도 설계.

"GraphQL이 좋아서"가 아니라 "REST의 한계가 명확해서" 도입하는 게 맞습니다.

## gRPC가 정당화되는 시점

내부 서비스 간 통신에서 다음이 중요할 때.

- **성능**: HTTP/2 + Protobuf로 페이로드 작고 지연이 낮음.
- **타입 안전성**: `.proto`가 단일 진실 소스. 코드젠으로 양쪽 타입을 강제.
- **스트리밍**: server/client/bidi streaming이 1급 시민.
- **다양한 언어 클라이언트**: 코드젠으로 일관된 클라이언트 자동 생성.

단점:

- 브라우저에서 직접 호출이 어렵습니다(grpc-web/proxy 필요).
- 디버깅이 REST보다 번거로움.
- 인프라(로드 밸런서, 트레이싱)가 HTTP/2와 잘 맞아야 함.

그래서 보통 **외부 API는 REST, 내부 서비스 메시는 gRPC**라는 형태가 자주 보입니다.

## 자주 묻는 디테일

- **REST에서 PUT vs PATCH**: PUT은 전체 교체(idempotent), PATCH는 부분 업데이트.
- **idempotency**: 결제, 메시지 발행처럼 멱등성이 중요한 엔드포인트는 클라이언트가 idempotency-key 헤더로 중복 요청을 안전하게 처리.
- **버저닝**: URL 버저닝(`/v1/`)은 단순하지만 클라이언트 마이그레이션 부담. 헤더 기반은 깔끔하지만 도구 지원이 약함. 사실상 URL 버저닝이 디폴트.
- **에러 응답**: RFC 7807(Problem Details)을 따르면 메시지 구조가 표준화돼 클라이언트 처리가 쉬워짐.

## 면접 follow-up

- "REST가 정말 RESTful한 적 있나요?" → 대부분의 "REST API"는 HATEOAS까지는 가지 않은 RPC over HTTP에 가깝습니다. 사실 그걸로 충분.
- "gRPC + 메시지 큐의 역할 분담?" → 동기 호출이면 gRPC, 비동기/eventual consistency면 큐. 호출 그래프가 동기로 깊어지면 cascading failure 위험.
- "GraphQL의 Federation은?" → 여러 GraphQL 서비스를 하나의 스키마로 묶는 패턴. 조직이 크고 도메인이 명확히 갈리는 환경에서 검토.
