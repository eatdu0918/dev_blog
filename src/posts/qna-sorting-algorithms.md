---
published: true
type: 'qna'
level: 'junior'
title: "정렬 알고리즘들의 시간복잡도와 특성을 비교해 주세요"
date: '2026-04-27'
categories: ['CS', 'Algorithm']
---

## 핵심 요약

| 알고리즘 | 평균 | 최악 | 메모리 | 안정 | 비고 |
|---|---|---|---|---|---|
| Bubble | O(n²) | O(n²) | O(1) | ✅ | 학습용 |
| Selection | O(n²) | O(n²) | O(1) | ❌ | 교환 횟수 적음 |
| Insertion | O(n²) | O(n²) | O(1) | ✅ | 거의 정렬된 데이터에 빠름 |
| Merge | O(n log n) | O(n log n) | O(n) | ✅ | 외부 정렬 가능 |
| Quick | O(n log n) | O(n²) | O(log n) | ❌ | 실무 평균 가장 빠름 |
| Heap | O(n log n) | O(n log n) | O(1) | ❌ | 우선순위 큐 |
| Tim | O(n log n) | O(n log n) | O(n) | ✅ | Java/Python 표준 |

## 안정 정렬(Stable Sort)이란

같은 키를 가진 원소들의 **상대 순서가 보존**되는 정렬. "이름 정렬 후 부서 정렬" 같은 다중 키 정렬에 중요.

## Quick Sort 디테일

면접에서 가장 자주 나옴.

- 피벗 선택 → 분할 → 재귀.
- 평균 O(n log n) 매우 빠름. 캐시 친화적(in-place).
- **최악 O(n²)**: 이미 정렬된 입력 + 첫/끝 피벗. 무작위 피벗 또는 median-of-three로 회피.
- 메모리 O(log n)은 재귀 스택.

## Merge Sort 디테일

- **분할 정복** 대표.
- 안정 정렬 + 보장된 O(n log n).
- 단점: 추가 메모리 O(n).
- 외부 정렬(디스크) + 분산 정렬에 유리. 연결 리스트에는 효율적.

## Heap Sort 디테일

- 배열 위에서 max-heap 구성 후 꺼내기.
- in-place + O(n log n) 보장.
- 캐시 비친화적이라 quicksort보다 실측 느림.

## Insertion Sort

- 작은 배열(보통 ≤ 10)이나 거의 정렬된 데이터에서 매우 빠름.
- 그래서 **하이브리드 정렬**(Tim/Intro Sort)이 작은 부분 배열에 사용.

## Tim Sort

- Java(Object 배열), Python의 표준.
- Merge + Insertion 하이브리드.
- 실세계 데이터(부분 정렬, 반복 패턴)에서 매우 효율.

## Intro Sort

- C++ std::sort, .NET Array.Sort.
- Quick → 깊이 임계 초과 시 Heap → 작은 배열은 Insertion.
- Quick의 평균 속도 + 최악 보장.

## O(n) 정렬

비교 기반은 O(n log n) 한계가 있음(정보이론 하한).

키 범위가 제한된 경우 비교 외:
- **Counting Sort**: 키 빈도 카운팅. 정수 + 작은 범위에 최적.
- **Radix Sort**: 자릿수별 안정 정렬. 정수/문자열에 효율.
- **Bucket Sort**: 균등 분포 가정.

## 언어별 표준 정렬

- **Java**: 원시 타입 = Dual-Pivot Quicksort. 객체 = Tim Sort.
- **Python**: `sorted` / `list.sort` = Tim Sort.
- **JavaScript**: ES2019+에서 `Array.prototype.sort` 안정성 보장. V8은 Tim Sort.
- **C++**: Intro Sort.

## 면접 단골 이슈

### "정렬을 직접 구현해 보세요"
- Merge 또는 Quick 가장 자주 요구.
- Quick의 파티션 알고리즘(Lomuto vs Hoare) 차이 알아두기.

### "왜 비교 기반은 O(n log n) 한계?"
- n개를 정렬하는 가능한 순열 = n!. 비교 한 번으로 1bit 정보 → log₂(n!) ≈ n log n.

### "안정성이 왜 중요?"
- 다중 키 정렬에서 이전 키 순서 보존.
- Java/Python 표준 정렬은 안정. C++ std::sort는 불안정 — `std::stable_sort` 따로.

## 자주 헷갈리는 디테일

- "Quick이 항상 빠르다"는 잘못. 작은 배열엔 Insertion이 빠름.
- 메모리 측에서 in-place라도 재귀 스택 비용 있음.
- 거의 정렬된 데이터엔 Tim이 O(n)에 가깝게 동작.

## 면접 follow-up

- "10억 개 데이터 정렬?" → 외부 정렬(Merge), 분산(MapReduce sort).
- "Top-K 문제?" → 힙(O(n log k)) 또는 quickselect(평균 O(n)).
- "안정 정렬을 불안정 정렬로 만드는 법?" → 키에 인덱스 결합 후 정렬.
