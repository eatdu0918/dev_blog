---
published: true
type: 'qna'
level: 'mid'
title: "Hash Table과 B-Tree/B+Tree — 자료구조와 인덱스의 연결고리"
date: '2026-04-26'
categories: ['CS', 'Data Structure', 'Database']
---

## Q1. Hash Table과 B+Tree의 차이를 한 줄로 설명해 주세요.

**A.**
- **Hash Table**: 평균 **O(1) 조회**, 순서/범위 조회 불가, 충돌 처리가 핵심.
- **B+Tree**: **O(log n) 조회**, 정렬/범위/디스크 친화적. 그래서 RDBMS 인덱스의 사실상 표준.

DB 인덱스가 거의 모두 B+Tree인 이유는 **디스크 I/O를 최소화하면서 범위 스캔까지 커버**하기 때문입니다.

---

## Q2. Hash Table의 충돌은 어떻게 해결하나요?

**A.** 두 가지 방식이 대표적입니다.

- **Chaining**: 버킷마다 연결 리스트. 단순, 메모리 가변. Java HashMap은 충돌 많아지면 트리(red-black)로 자동 변환.
- **Open Addressing**: 충돌 시 다른 버킷 탐색(linear, quadratic, double hashing). 캐시 친화적이지만 삭제가 까다로움.

추가로 Robin Hood, Cuckoo, Hopscotch 같은 분산을 균등하게 만드는 변종도 있습니다.

---

## Q3. Load factor와 리해싱이란 뭔가요?

**A.** **load factor = 항목 수 / 버킷 수**. 일반적으로 0.75 초과 시 버킷 크기를 2배로 늘리고 모든 키를 재배치합니다.

리해싱은 amortized O(1)이지만 한 번에 큰 비용이 발생합니다. 실시간 시스템(Redis 등)은 **incremental rehashing**으로 한 번에 일부씩 옮겨 burst를 피합니다.

---

## Q4. B-Tree와 B+Tree의 차이는 뭔가요?

**A.** 데이터 저장 위치와 리프 연결입니다.

- **B-Tree**: 모든 노드에 데이터(또는 포인터) 저장. 노드별 자식이 많아 트리 높이가 낮음.
- **B+Tree**: **데이터는 리프에만**, 내부 노드는 인덱스 역할. **리프끼리 연결 리스트**로 묶여 있어 범위 스캔이 매우 빠름.

DB는 거의 항상 B+Tree를 씁니다. 한 페이지(보통 16KB)에 더 많은 키를 담을 수 있고 범위 쿼리에 압도적으로 유리합니다.

---

## Q5. 왜 B+Tree가 디스크에 강한가요?

**A.** 노드 크기를 디스크 블록(페이지)에 맞추면 **한 노드 읽기 = 디스크 1회 I/O**.

트리 높이가 3~4 정도면 수억 행도 인덱싱할 수 있어, 조회당 디스크 I/O가 3~4회로 끝납니다. 인접 리프가 디스크상으로도 가까우면 prefetch 효과까지 받습니다.

---

## Q6. UUID v4를 InnoDB의 PK로 쓰면 왜 나쁜가요?

**A.** InnoDB는 **클러스터드 인덱스**라 PK가 곧 데이터의 물리 위치입니다. UUID v4는 무작위라 삽입이 트리 곳곳에 흩어져:

- **페이지 분할** 폭증.
- **단편화** 증가.
- 캐시(buffer pool) 효율 저하.

대안:
- **AUTO_INCREMENT BIGINT**: 단조 증가, 가장 안전.
- **UUIDv7 / ULID**: 시간 정렬형이라 단조 증가에 가까움.

---

## Q7. Hash Index와 B+Tree Index 중 무엇을 선택하나요?

**A.** 거의 항상 **B+Tree**입니다.

| | Hash | B+Tree |
|---|---|---|
| `=` 조회 | O(1) | O(log n) |
| `BETWEEN`, `>`, `<` | 불가 | 가능 |
| `ORDER BY` | 불가 | 가능 |
| `LIKE 'abc%'` | 불가 | 가능 |

PostgreSQL은 hash index를 지원하지만 거의 쓰이지 않습니다. B+Tree가 등호 조회에서도 충분히 빠르고 범위까지 커버하므로 **운영 단순화** 측면에서 통일이 낫습니다.

---

## Q8. LSM Tree는 언제 쓰이나요?

**A.** **쓰기가 매우 많은 워크로드**에 적합합니다. 시계열, 로그, 메시지.

동작:
- 메모리(memtable)에 정렬해서 쌓음.
- 일정 크기가 되면 디스크에 정렬된 SSTable로 flush.
- 백그라운드 compaction으로 SSTable 병합.

**쓰기↑ 읽기↓** 트레이드오프. Cassandra, RocksDB, LevelDB가 대표 예. 일반 OLTP는 B+Tree가 무난합니다.

---

## Q9. 메모리 내 자료구조에서 정렬이 필요할 때는 무엇을 쓰나요?

**A.** 언어별 표준이 있습니다.

- **Java TreeMap, C++ std::map**: Red-Black Tree.
- **Redis sorted set**: Skip List(확률적 균형).
- **Trie**: 문자열 prefix 검색, 자동완성.

해시는 평균이 빠르지만 정렬이 필요하면 트리/스킵리스트가 적합합니다. 워크로드 특성에 맞춰 선택하면 됩니다.
