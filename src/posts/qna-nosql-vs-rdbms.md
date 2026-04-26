---
published: true
type: 'qna'
level: 'mid'
title: "NoSQL과 RDBMS는 어떤 기준으로 선택하시나요?"
date: '2026-04-27'
categories: ['Database', 'Design']
---

## 핵심 요약

선택 기준은 "**데이터 모델/일관성/스케일링 요구**"이지 "현대적이냐 아니냐"가 아닙니다.

- **RDBMS**: 정형 스키마, ACID 트랜잭션, 복잡 JOIN, 일관성 우선.
- **NoSQL**: 유연한 스키마, 수평 확장, 특정 액세스 패턴 최적화. 종류마다 강점이 다름.

## NoSQL의 4가지 유형

### Key-Value (Redis, DynamoDB)
- 단일 키로 O(1) 조회. 캐시, 세션, 카운터.

### Document (MongoDB, Couchbase)
- JSON-like. 한 도큐먼트에 관련 데이터 묶음. 카탈로그, 컨텐츠.

### Column-Family (Cassandra, HBase, ScyllaDB)
- 행 키 + 컬럼 그룹. 쓰기 처리량 매우 높음. 시계열, 로그.

### Graph (Neo4j, Neptune)
- 노드/엣지. 관계 탐색 효율. 추천, 사기 탐지.

## CAP 정리

분산 시스템에서 **C(일관성), A(가용성), P(파티션 허용)** 셋 중 둘만.
- 네트워크 파티션은 현실에서 불가피 → 실질적 선택은 **CP vs AP**.
- RDBMS(클러스터형) ≈ CP. Cassandra ≈ AP. MongoDB는 설정에 따라.

다만 CAP은 "장애 시 한쪽을 포기"라는 단순한 모델. 실무에는 PACELC(파티션 시 + 평상시 trade-off)가 더 정확.

## ACID vs BASE

- **ACID**: 원자성/일관성/격리/지속성. 강한 보장.
- **BASE**: Basically Available, Soft state, Eventually consistent. 결과적 일관성.

NoSQL이 모두 BASE는 아님. DynamoDB는 강한 일관성 옵션 제공.

## 선택 기준

| 요구 | 권장 |
|---|---|
| 복잡한 JOIN, 트랜잭션 | RDBMS |
| 스키마 자주 변함 | Document |
| 수평 확장 + 쓰기 폭발 | Column-Family |
| 빠른 단일 키 조회 | Key-Value |
| 관계 탐색 | Graph |
| 강한 일관성 + 정형 | RDBMS |

## 흔한 오해

- "NoSQL은 빠르다" → 특정 패턴에 한정. 임의 쿼리는 보통 느림.
- "NoSQL은 트랜잭션 X" → MongoDB 4.0+ 멀티 도큐먼트 트랜잭션 지원. 단 비용↑.
- "RDBMS는 수평 확장 어렵다" → 읽기 복제, 샤딩, Vitess/Citus 같은 분산 RDBMS 존재.
- "NoSQL은 스키마 없다" → 스키마는 **애플리케이션 코드에 들어감**. 검증 책임이 옮겨질 뿐.

## Polyglot Persistence

한 시스템에서 여러 DB를 용도별로:
- 주 데이터 = PostgreSQL.
- 캐시/세션 = Redis.
- 검색 = Elasticsearch / OpenSearch.
- 로그/시계열 = ClickHouse / TimescaleDB.

문제: 동기화 복잡도. CDC, outbox, 이벤트 스트림으로 묶음.

## 데이터 모델링 차이

### RDBMS
- 정규화 후 JOIN.
- 데이터 무결성을 DB가 보장.

### NoSQL (특히 Document)
- **쿼리 패턴 우선** 모델링. 자주 같이 읽으면 묶고, 따로 읽으면 분리.
- "1:N에서 N의 크기"가 모델 결정 핵심(MongoDB 권장: 임베드 vs 참조).

## 자주 헷갈리는 디테일

- "수평 확장 = NoSQL 전유물"이 아님. 샤딩 지원 RDBMS도 있음.
- "schema-less = 자유롭다"는 운영에서 양날의 검. 검증/마이그레이션 책임이 앱에.
- DynamoDB 같은 매니지드 NoSQL은 RCU/WCU 한도와 hot partition이 운영 핵심.

## 면접 follow-up

- "결과적 일관성을 받아들일 수 없는 도메인?" → 결제 잔액, 재고. 강한 일관성 또는 saga + 보상 트랜잭션.
- "MongoDB에서 트랜잭션 비용?" → 멀티 도큐먼트 트랜잭션은 단일 도큐먼트보다 훨씬 비쌈. 도큐먼트 모델로 한 단위에 담는 설계 우선.
- "Polyglot의 단점?" → 운영 복잡도, 동기화 일관성, 모니터링 도구 분산. 한 종류로 충분하면 그게 더 나을 수도.
