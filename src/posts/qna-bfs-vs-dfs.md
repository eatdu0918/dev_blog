---
published: true
type: 'qna'
level: 'junior'
title: "BFS와 DFS의 차이는? 언제 무엇을 선택하나요?"
date: '2026-04-27'
categories: ['CS', 'Algorithm']
---

## 핵심 요약

- **BFS(너비 우선)**: 큐 사용, 가까운 노드부터. **최단 경로**(가중치 1) 찾기.
- **DFS(깊이 우선)**: 스택/재귀, 한 길로 끝까지. **모든 경로 탐색**, 백트래킹.

둘 다 시간 O(V+E), 공간 O(V).

## BFS 구현

```javascript
function bfs(start, graph) {
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift();
    for (const next of graph[node]) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
}
```

`shift()`는 O(n) — 실무에선 deque 사용(JS는 인덱스 + head 포인터).

## DFS 구현

재귀:
```javascript
function dfs(node, graph, visited = new Set()) {
  if (visited.has(node)) return;
  visited.add(node);
  for (const next of graph[node]) dfs(next, graph, visited);
}
```

스택:
```javascript
function dfsIter(start, graph) {
  const visited = new Set();
  const stack = [start];
  while (stack.length) {
    const node = stack.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    for (const next of graph[node]) stack.push(next);
  }
}
```

## 메모리/스택

- BFS: 같은 레벨의 노드를 모두 큐에 — 너비 큰 그래프에서 메모리↑.
- DFS: 깊이 만큼 스택 — 깊이 큰 그래프에서 스택 오버플로 위험. 반복 버전이 안전.

## 적용 사례

### BFS
- **최단 경로**(간선 가중치 동일).
- **레벨별 처리**: 트리의 i번째 레벨.
- 이분 그래프 판정.
- 격자에서 최소 이동 횟수.

### DFS
- **연결 요소** 찾기.
- **사이클 감지**(방향/무방향).
- **위상 정렬**(DAG).
- **백트래킹**: 순열, 조합, N-Queens, 스도쿠.
- **강한 연결 요소**(Tarjan, Kosaraju).

## 가중치 그래프

- 양수 가중치 → **Dijkstra**(우선순위 큐).
- 음수 가중치 → **Bellman-Ford**, 음수 사이클 감지.
- 모든 쌍 → **Floyd-Warshall** O(V³).

BFS는 가중치가 모두 같을 때만 최단.

## 트리 순회

DFS의 변종:
- **전위(Pre-order)**: 루트 → 좌 → 우.
- **중위(In-order)**: 좌 → 루트 → 우. BST에서 정렬 결과.
- **후위(Post-order)**: 좌 → 우 → 루트. 자식부터 처리(예: 폴더 크기 계산).

BFS의 트리 적용 = 레벨 순회.

## 면접에서 자주 나오는 그래프 문제

- **단어 사다리(Word Ladder)**: BFS — 한 글자 변경으로 도달.
- **섬의 개수(Number of Islands)**: BFS/DFS 둘 다 가능.
- **코스 스케줄(Course Schedule)**: 위상 정렬(DFS) 또는 Kahn(BFS).
- **미로 최단 경로**: BFS.
- **모든 경로 출력**: DFS + 백트래킹.

## 자주 헷갈리는 디테일

- DFS 재귀에서 `visited`를 인자로 넘기지 않으면 **테스트 케이스 간 공유** 버그. 함수 안에 매번 생성 또는 명시적 reset.
- BFS는 큐, DFS는 스택을 쓴다 — 자료구조만 바꾸면 같은 코드.
- 양방향 BFS(Bidirectional)로 탐색 공간 절반 — 단어 사다리 등에 효과적.

## 면접 follow-up

- "DFS 재귀의 단점?" → 깊은 그래프에서 스택 오버플로. 반복 버전 또는 명시적 스택.
- "방향 그래프에서 사이클 검사?" → DFS + 진행 중(visiting) 상태 추적. back edge 발견 = 사이클.
- "BFS로 최단 경로 못 찾는 그래프?" → 가중치가 다를 때. Dijkstra 필요.
