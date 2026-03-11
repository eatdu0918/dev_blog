---
published: true
title: "핵심 자료구조 이해하기: 스택, 큐, 덱, 힙"
description: "스택, 큐, 덱, 힙 자료구조의 핵심 원리와 차이점을 살펴보고, 직접 구현해보며 어떻게 동작하는지 배워봅니다."
date: "2026-03-11"
tags: ["CS"]
---

# 핵심 자료구조 이해하기: 스택, 큐, 덱, 힙

소프트웨어 개발을 하다 보면 처리해야 할 데이터를 어떤 방식으로 관리하느냐에 따라 프로그램의 성능과 복잡도가 크게 달라집니다. 특히 데이터를 넣고 빼는 순서와 규칙은 알고리즘의 뼈대를 이루는 필수적인 요소입니다. 오늘은 컴퓨터 과학에서 가장 기본이 되면서도 널리 쓰이는 네 가지 자료구조 스택(Stack), 큐(Queue), 덱(Deque), 힙(Heap)에 대해 학습한 내용을 정리해 보았습니다.

:::component DataStructuresCanvas
## 스택 (Stack): 나중에 들어온 것이 먼저 나간다

스택은 **LIFO (Last-In-First-Out)** 원칙을 따르는 선형 자료구조입니다. 책상 위에 책을 차곡차곡 쌓아 올리는 것을 연상해 보면 그 구조적 특성이 바로 와닿습니다. 새로운 책을 올릴 때도 맨 위에 얹고, 책을 빼낼 때도 맨 위에서부터 꺼내는 방식과 같습니다.

- **주요 연산**:
  - `push`: 데이터를 최상단에 추가합니다.
  - `pop`: 최상단의 데이터를 제거하고 반환합니다.
- **활용 사례**: 브라우저의 뒤로 가기 기능, 실행 취소(Undo), 함수의 콜 스택(Call Stack) 등

```typescript
export class Stack<T> {
  private items: T[] = [];

  push(element: T): void {
    this.items.push(element);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }
}
```

## 큐 (Queue): 먼저 들어온 것이 먼저 나간다

큐는 **FIFO (First-In-First-Out)** 원칙을 따릅니다. 실생활에서 영화관 매표소에 먼저 줄을 선 관람객이 먼저 표를 구매하고 나가는 구조를 대입해 보면 동작 원리가 명확해집니다.

- **주요 연산**:
  - `enqueue`: 큐의 맨 뒤에 데이터를 추가합니다.
  - `dequeue`: 큐의 맨 앞의 데이터를 제거하고 반환합니다.
- **활용 사례**: 프린터 대기열, 메시지 큐, BFS(너비 우선 탐색) 알고리즘 등

```typescript
export class Queue<T> {
  private items: T[] = [];

  enqueue(element: T): void {
    this.items.push(element);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }
}
```

## 덱 (Deque): 양방향에서 입출력이 가능한 자료구조

덱은 **Double-Ended Queue**의 약자로, 스택과 큐의 특성을 모두 가지고 있습니다. 구조의 양쪽 끝에서 데이터를 삽입하고 삭제할 수 있습니다. 

- **주요 연산**:
  - `addFront` / `addRear`: 각각 앞과 뒤에 데이터를 추가합니다.
  - `removeFront` / `removeRear`: 각각 앞과 뒤의 데이터를 제거합니다.
- **활용 사례**: 최근 사용된 항목(LRU) 캐시 구현, 양방향 탐색 등

```typescript
export class Deque<T> {
  private items: T[] = [];

  addFront(element: T): void {
    this.items.unshift(element);
  }

  addRear(element: T): void {
    this.items.push(element);
  }
  
  removeFront(): T | undefined {
    return this.items.shift();
  }

  removeRear(): T | undefined {
    return this.items.pop();
  }
}
```

## 힙 (Heap): 우선순위가 높은 데이터부터 꺼내기

힙은 최댓값이나 최솟값을 빠르게 찾아내기 위해 고안된 완전 이진 트리를 기반으로 하는 자료구조입니다. 최대 힙(Max Heap)에서는 부모 노드가 자식 노드보다 항상 크거나 같으며, 최소 힙(Min Heap)에서는 부모 노드가 가장 작습니다.

- **주요 연산**:
  - `insert`: 요소를 트리의 가장 끝단에 넣고 올바른 위치를 찾아 위로 올려보냅니다(Heapify Up).
  - `extract`: 루트 노드(최대 혹은 최소)를 반환한 후, 트리의 맨 마지막 요소를 루트로 옮기고 아래로 내려보냅니다(Heapify Down).
- **활용 사례**: 우선순위 큐(Priority Queue), 힙 정렬, 다익스트라 최단 경로 알고리즘 등

```typescript
export class MaxHeap {
  private heap: number[] = [];

  insert(value: number): void {
    this.heap.push(value);
    this.heapifyUp(this.heap.length - 1);
  }

  extractMax(): number | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const max = this.heap[0];
    this.heap[0] = this.heap.pop() as number;
    this.heapifyDown(0);
    return max;
  }
  // heapifyUp, heapifyDown 구현체는 내부 규칙을 통해 트리를 재정비합니다.
}
```

## 코드 검증

위에서 구현한 내용들이 규칙에 맞게 정상적으로 동작하는지 확인하기 위해 각 구조에 대한 테스트 코드를 작성했습니다.

```typescript
import { describe, it, expect } from 'vitest';
import { Stack, Queue, Deque, MaxHeap } from '../src/examples/data-structures';

describe('Stack', () => {
  it('LIFO 규칙에 따라 아이템이 스택에 들어가고 나와야 합니다', () => {
    const stack = new Stack<number>();
    stack.push(1);
    stack.push(2);
    expect(stack.pop()).toBe(2);
  });
});

describe('MaxHeap', () => {
  it('최대 힙의 속성을 적절히 유지해야 합니다', () => {
    const heap = new MaxHeap();
    heap.insert(10);
    heap.insert(5);
    heap.insert(20);
    expect(heap.extractMax()).toBe(20); // 가장 큰 값 추출
  });
});
```
직접 구성한 테스트 환경을 통해 정상적으로 `LIFO`, `FIFO` 규칙과 트리 정렬 속성이 의도된 대로 유지됨을 확인할 수 있었습니다.

## 마치며

스택과 큐 같은 경우 평소 단순히 배열의 내장 메서드를 통해 관리해왔지만, 외부에서의 접근을 제한하고 책임(LIFO 혹은 FIFO)을 명확하게 분리하는 것으로 자료구조 본연의 목적에 부합하게 동작한다는 것을 다시금 새기게 되었습니다.

또한 배열이나 연결 리스트만으로는 매번 전체 요소를 순회해야 하는 복잡한 우선순위 처리 문제를, 힙을 통해 트리 구조로 접근할 경우 성능상 큰 이점을 얻을 수 있다는 점이 특별히 인상 깊었습니다. 앞으로도 익숙함에 젖어 단순히 내장 객체를 남용하기보다는, 문제의 상황과 제약에 걸맞은 가장 적절한 컨테이너를 고민하는 습관을 들여야겠습니다.
