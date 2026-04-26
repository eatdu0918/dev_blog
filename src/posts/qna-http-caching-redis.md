---
published: true
type: 'qna'
level: 'mid'
title: "HTTP 캐시와 Redis 캐시 — 어떤 계층에 무엇을 넣고, 일관성은 어떻게 지키나요?"
date: '2026-04-26'
categories: ['Performance', 'Backend', 'Cache']
---

## 핵심 요약

캐싱은 한 군데가 아니라 **계층**입니다. 브라우저 → CDN → Reverse Proxy → 애플리케이션(Redis) → DB. 각 계층은 **TTL과 무효화 비용**이 다르고, "어디에 둘지"는 **데이터의 변경 빈도와 freshness 요구**로 결정됩니다.

## HTTP 캐시 헤더

브라우저/CDN이 따르는 표준입니다.

- **`Cache-Control: max-age=N`**: N초 동안 캐시 사용. `public`(공유 가능) vs `private`(브라우저만).
- **`Cache-Control: no-store`**: 절대 저장 금지(민감 정보).
- **`Cache-Control: no-cache`**: 저장은 하지만 사용 전 재검증. **`no-store`와 다름**.
- **`ETag` / `If-None-Match`**: 컨텐츠 해시. 304 Not Modified로 본문 전송 절약.
- **`Last-Modified` / `If-Modified-Since`**: 시간 기반 검증, 초 단위 한계.
- **`stale-while-revalidate=N`**: 만료된 응답을 N초 동안 즉시 반환하면서 백그라운드로 갱신. **체감 성능**에 큰 효과.
- **`stale-if-error`**: 오리진 장애 시 만료된 응답으로 fallback.

정적 자산은 **immutable + 1년 max-age + 파일명 해싱**(`app.abc123.js`)이 정석. 빌드마다 파일명이 바뀌므로 무효화 자동.

## Redis 캐시 패턴

### Cache-Aside (Lazy Loading)
가장 흔한 패턴. 읽기: 캐시 miss → DB 조회 → 캐시에 저장. 쓰기: DB만 갱신 + 캐시 **삭제**.

- 캐시에 **갱신**이 아니라 **삭제**가 안전합니다(동시성 시나리오에서 stale 값이 캐시에 남는 문제 회피).
- 단점: 첫 요청은 항상 느림 + 캐시와 DB가 잠시 불일치 가능.

### Write-Through / Write-Behind
- Write-Through: 쓰기 시 DB+캐시 동시. 일관성↑, 쓰기 지연↑.
- Write-Behind: 캐시에 먼저 쓰고 DB 비동기. 빠르지만 **유실 위험**.

### Read-Through
캐시 라이브러리가 miss 시 DB 조회까지 처리. 애플리케이션 코드 단순화.

## 캐시 일관성 — DB 갱신 시 무엇을 먼저?

- **DB 갱신 후 캐시 삭제**(권장). 갱신 후 재읽기에서 새 값으로 채워짐.
- **캐시 갱신 후 DB 갱신**은 위험: DB 실패 시 캐시가 잘못된 값 보유.
- 그럼에도 race condition은 남습니다. **TTL을 짧게 주는 것이 최후의 보험**.

## Cache Stampede (Thundering Herd)

핫 키가 만료되는 순간 수많은 요청이 동시에 DB로 몰리는 문제.

- **Probabilistic Early Expiration**: 만료 전부터 일정 확률로 미리 갱신.
- **단일 갱신 락(SETNX)**: 한 요청만 DB 조회, 나머지는 대기 또는 stale 반환.
- **stale-while-revalidate**: 만료 후에도 잠시 stale 반환하면서 백그라운드 갱신.
- **fan-out 회피**: 같은 키에 대한 in-flight 요청을 메모리에서 통합(single-flight).

## Hot Key / Big Key

- **Hot Key**: 한 키에 트래픽 집중 → Redis 단일 노드 CPU 한계. 로컬 캐시(에어리어 캐시) 한 단계 추가, 키 분할.
- **Big Key**: 한 키 값이 수 MB → 네트워크/메모리 부담. 분할 저장.

## TTL 설계

- 데이터 변경 빈도 대비 TTL을 정함. 절대로 "긴 TTL + 정확한 무효화"에만 의존하지 말 것 — 분산 환경에서 무효화 누락은 반드시 발생합니다.
- **TTL은 안전장치**. 무효화는 정확성 도구.

## 어떤 계층에 둘까

- **거의 안 변하는 정적 자산** → CDN + 긴 max-age + 해시 파일명.
- **자주 안 변하는 사용자별 데이터** → Redis(짧은 TTL) + 변경 시 삭제.
- **실시간성 요구** → 캐시 안 쓰거나 SWR 패턴으로 stale 표시 + 갱신.
- **개인정보** → `private, no-store` 또는 서버 전용 캐시.

## 자주 헷갈리는 디테일

- `no-cache`는 캐시 금지가 아니라 **사용 전 재검증** 강제. 진짜 금지는 `no-store`.
- ETag는 강한 검증/약한 검증(`W/`) 두 종류. 압축으로 바이트가 바뀌면 강한 ETag는 깨짐.
- Redis도 결국 외부 의존. **장애 시 origin으로 fallback** 가능한지 항상 점검.

## 면접 follow-up

- "캐시 무효화가 분산 시스템의 어려운 문제인 이유?" → 노드 간 일관된 시점에 삭제 보장이 어려움. pub/sub, TTL, 일관성 모델 trade-off.
- "TTL을 어떻게 정하나?" → 비즈니스 허용 stale 시간 + 최악의 쓰기 빈도 + 캐시 적중률 측정 후 조정.
- "Cache stampede를 직접 막아본 경험?" → SETNX 락, jitter TTL, SWR 중 무엇을 썼고 왜.
