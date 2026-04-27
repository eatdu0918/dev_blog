---
published: true
type: 'qna'
level: 'junior'
title: "BFS와 DFS의 차이는? 언제 무엇을 선택하나요?"
date: '2026-04-27'
categories: ['CS', 'Algorithm']
---

## Q1. BFS와 DFS의 차이를 한 줄로 설명해 주세요.

**A.** BFS는 **큐**로 가까운 노드부터 너비 우선 탐색, DFS는 **스택/재귀**로 한 길 끝까지 깊이 우선 탐색합니다. 둘 다 시간 복잡도는 O(V+E), 공간은 O(V)지만 활용처가 다릅니다.

```javascript
// BFS
const queue = [start];
while (queue.length) { const n = queue.shift(); /* ... */ queue.push(next); }

// DFS
const stack = [start];
while (stack.length) { const n = stack.pop(); /* ... */ stack.push(next); }
```

자료구조만 바꾸면 거의 같은 코드입니다.

---

## Q2. 언제 BFS, 언제 DFS를 쓰나요?

**A.** 문제 유형으로 갈립니다.

**BFS가 적합**:
- 가중치 동일한 그래프의 **최단 경로** (미로 최소 이동, 단어 사다리).
- 트리의 **레벨별 순회**.
- 이분 그래프 판정.

**DFS가 적합**:
- **연결 요소** 찾기, 사이클 감지.
- **위상 정렬**(DAG).
- **백트래킹**(순열, 조합, N-Queens, 스도쿠).
- 강한 연결 요소(Tarjan, Kosaraju).

---

## Q3. DFS는 재귀와 반복 중 무엇을 쓰나요?

**A.** 재귀가 짧고 직관적이지만, **깊은 그래프에서는 스택 오버플로** 위험이 있어 반복 버전이 안전합니다.

```javascript
function dfs(node, graph, visited) {
  if (visited.has(node)) return;
  visited.add(node);
  for (const next of graph[node]) dfs(next, graph, visited);
}
```

또 재귀 인자로 `visited`를 안 넘기면 함수 호출 간 공유되어 테스트 케이스 격리가 깨지는 버그가 자주 납니다.

---

## Q4. BFS로 최단 경로를 찾을 수 없는 경우는 언제인가요?

**A.** **간선 가중치가 다를 때**입니다. BFS는 모든 간선을 동일 비용으로 가정하기 때문에 가중치 그래프에는 부정확한 답을 줍니다.

대안:
- 양수 가중치 → **Dijkstra** (우선순위 큐).
- 음수 가중치 → **Bellman-Ford** (음수 사이클 감지 가능).
- 모든 쌍 → **Floyd-Warshall** O(V³).

---

## Q5. 방향 그래프에서 사이클은 어떻게 감지하나요?

**A.** DFS + 노드 상태 3가지로 추적합니다.

- `WHITE`(미방문) → `GRAY`(진행 중) → `BLACK`(완료).
- DFS 도중 GRAY 노드를 다시 만나면 **back edge** = 사이클.

무방향 그래프는 더 간단해서 부모를 제외한 방문 노드를 만나면 사이클입니다.

위상 정렬은 사이클이 없는 DAG에서만 가능하므로 같은 알고리즘으로 검사합니다.

---

## Q6. 트리 순회 종류와 차이는요?

**A.** DFS의 변종 3가지 + BFS의 레벨 순회.

- **전위(Pre-order)** 루트 → 좌 → 우: 트리 복제.
- **중위(In-order)** 좌 → 루트 → 우: BST에서 정렬된 결과.
- **후위(Post-order)** 좌 → 우 → 루트: 자식부터 처리(폴더 크기 계산, 트리 삭제).
- **레벨 순회**: BFS. 같은 깊이 노드를 묶어 처리.

---

## Q7. 양방향 BFS는 무엇이고 언제 쓰나요?

**A.** 시작과 끝에서 동시에 BFS를 진행해 중간에서 만나면 종료하는 기법입니다. 탐색 공간이 거의 절반으로 줄어듭니다.

분기 인수가 큰 그래프(단어 사다리, 퍼즐 등)에서 일반 BFS의 시간을 크게 단축합니다. 단, 양방향에서 같은 그래프를 탐색해야 하므로 양방향 그래프 또는 역방향 인접 리스트가 필요합니다.

---

## Q8. 면접에서 자주 나오는 BFS/DFS 문제는 뭔가요?

**A.** 빈출 5가지:

1. **섬의 개수**(Number of Islands) — BFS/DFS 둘 다 가능.
2. **단어 사다리**(Word Ladder) — BFS, 양방향 BFS면 더 빠름.
3. **코스 스케줄**(Course Schedule) — 위상 정렬(DFS) 또는 Kahn(BFS).
4. **미로 최단 경로** — BFS.
5. **모든 경로 출력 / N-Queens** — DFS + 백트래킹.

문제를 보고 "최단 = BFS, 모든 경우 = DFS"로 1차 분류한 뒤 디테일을 채우면 됩니다.
