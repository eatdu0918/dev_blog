---
published: true
type: 'qna'
level: 'mid'
title: "Hash Table과 B-Tree/B+Tree — 자료구조와 인덱스의 연결고리"
date: '2026-04-26'
categories: ['CS', 'Data Structure', 'Database']
---

## 핵심 요약

- **Hash Table**: 평균 O(1) 조회, **순서/범위 조회 불가**, 충돌 처리가 핵심.
- **B-Tree / B+Tree**: O(log n) 조회, **정렬 + 범위 + 디스크 친화적**. 그래서 RDBMS 인덱스의 표준.
- DB 인덱스의 거의 전부가 B+Tree인 이유는 "**디스크 I/O를 최소화하면서 범위 스캔까지 커버**"라는 단 하나의 결정.

## Hash Table

### 충돌 해결

- **Chaining**: 버킷마다 연결 리스트. 단순, 메모리 가변. Java HashMap은 충돌 많아지면 트리(red-black)로 변환.
- **Open Addressing**: 충돌 시 다른 버킷 탐색(linear/quadratic/double hashing). 캐시 친화적이지만 삭제가 까다로움.
- **Robin Hood / Cuckoo / Hopscotch**: 분산을 균등하게.

### Load factor와 리해싱

- 일반적으로 0.75 초과 시 버킷 크기 2배 + 모든 키 재배치.
- 리해싱 비용은 amortized O(1)이지만 한 번에 발생 → 실시간 시스템에서는 incremental rehashing(Redis 등) 사용.

### 한계

- **순서 없음** → "최근 N개", "범위 X~Y" 조회 불가.
- 해시 함수 품질이 성능 결정. 악의적 키로 충돌 폭증시키면 DoS 가능(해시 충돌 공격) → 시드 랜덤화.

## B-Tree

- 다중 자식을 가진 균형 트리. 한 노드에 여러 키 저장 → **트리 높이가 낮음**.
- 디스크 블록 크기에 노드 크기를 맞추면 한 노드 읽기 = 디스크 1회 읽기.
- 노드 분할/병합으로 균형 유지.

## B+Tree

B-Tree의 확장. RDBMS 인덱스의 사실상 표준.

- **모든 데이터(또는 키 + 포인터)는 리프에만**. 내부 노드는 인덱스 역할.
- **리프 노드끼리 연결 리스트**로 연결 → **순차/범위 스캔이 매우 빠름**.
- 같은 높이에 더 많은 키 → 트리 높이 더 낮음.

### 왜 디스크에 강한가

- 트리 높이 3~4면 수억 행 인덱싱 가능 → 조회당 디스크 I/O 3~4회.
- 인접 리프가 디스크 상에서도 가까우면 prefetch에 유리.
- **MySQL InnoDB**: 클러스터드 인덱스(PK 자체가 데이터 위치). 따라서 **PK는 짧고 단조 증가**가 좋음(UUID v4는 페이지 분할 폭증).

## Hash Index vs B+Tree Index

| | Hash | B+Tree |
|---|---|---|
| `=` 조회 | O(1) | O(log n) |
| `BETWEEN`, `>`, `<` | 불가 | 가능 |
| `ORDER BY` | 불가 | 가능 |
| `LIKE 'abc%'` | 불가 | 가능(prefix) |
| `LIKE '%abc'` | 불가 | 불가 |

PostgreSQL은 hash index 지원하지만 거의 안 쓰임. **B+Tree가 = 조회에서도 충분히 빠르고 범위까지 커버**하기 때문.

## 다른 트리들

- **Red-Black / AVL**: 메모리 내 균형 트리. Java TreeMap, C++ std::map.
- **LSM Tree**: 쓰기 최적화. 메모리에 쌓다가 디스크에 정렬된 SSTable로 flush + 백그라운드 compaction. Cassandra, RocksDB, LevelDB. **쓰기↑ 읽기↓** 트레이드오프.
- **Trie**: 문자열 prefix 검색. 자동 완성.
- **Skip List**: 확률적 균형 구조. Redis의 sorted set 내부.

## 자주 헷갈리는 디테일

- "인덱스 = B-Tree"라기보다 "**B+Tree**"가 더 정확.
- 해시맵의 평균 O(1)은 **좋은 해시 함수 + load factor 관리** 전제. 최악은 O(n).
- LSM은 디스크 친화적인 다른 답. 시계열/로그성 워크로드에서 자주 등장.

## 인덱스 설계로 연결

- 등호 조회만 한다면 → 어느 쪽도 충분, B+Tree로 통일이 운영 단순.
- 범위/정렬 조회 자주 → B+Tree 필수.
- 메모리 캐시(예: Redis HSET) → 해시 테이블, 정렬은 sorted set(skip list).
- 시계열 / 대량 쓰기 → LSM 기반 엔진 고려.

## 면접 follow-up

- "왜 InnoDB의 클러스터드 인덱스에서 UUID PK가 나쁜가?" → 무작위 삽입 → 페이지 분할 + 단편화 + 캐시 효율 저하. UUIDv7/ULID처럼 시간 정렬형이 대안.
- "B+Tree 높이를 어떻게 추정?" → fanout(한 노드의 키 수)을 b라 하면 b^h ≥ n. 노드 크기 = 페이지 크기(보통 16KB).
- "해시 충돌 공격을 어떻게 막나?" → 해시 시드 랜덤화, SipHash 같은 keyed hash 사용.
