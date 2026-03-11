import { describe, it, expect } from 'vitest';
import { Stack, Queue, Deque, MaxHeap } from '../src/examples/data-structures';

describe('Stack', () => {
  it('should push and pop items following LIFO', () => {
    const stack = new Stack<number>();
    stack.push(1);
    stack.push(2);
    expect(stack.peek()).toBe(2);
    expect(stack.pop()).toBe(2);
    expect(stack.size()).toBe(1);
    expect(stack.pop()).toBe(1);
    expect(stack.isEmpty()).toBe(true);
  });
});

describe('Queue', () => {
  it('should enqueue and dequeue items following FIFO', () => {
    const queue = new Queue<string>();
    queue.enqueue('a');
    queue.enqueue('b');
    expect(queue.peek()).toBe('a');
    expect(queue.dequeue()).toBe('a');
    expect(queue.size()).toBe(1);
    expect(queue.dequeue()).toBe('b');
    expect(queue.isEmpty()).toBe(true);
  });
});

describe('Deque', () => {
  it('should add and remove items from both ends', () => {
    const deque = new Deque<number>();
    deque.addRear(1);
    deque.addFront(2); // [2, 1]
    deque.addRear(3);  // [2, 1, 3]
    
    expect(deque.peekFront()).toBe(2);
    expect(deque.peekRear()).toBe(3);
    
    expect(deque.removeFront()).toBe(2); // [1, 3]
    expect(deque.removeRear()).toBe(3);  // [1]
    expect(deque.size()).toBe(1);
  });
});

describe('MaxHeap', () => {
  it('should maintain max heap property', () => {
    const heap = new MaxHeap();
    heap.insert(10);
    heap.insert(5);
    heap.insert(20);
    heap.insert(1);
    
    expect(heap.peek()).toBe(20); // 20 is max
    
    expect(heap.extractMax()).toBe(20);
    expect(heap.extractMax()).toBe(10);
    expect(heap.extractMax()).toBe(5);
    expect(heap.extractMax()).toBe(1);
    expect(heap.isEmpty()).toBe(true);
  });
});
