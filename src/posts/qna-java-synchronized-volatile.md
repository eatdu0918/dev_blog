---
published: true
type: 'qna'
level: 'mid'
title: "Java의 synchronized와 volatile은 무엇이 다른가요?"
date: '2026-04-27'
categories: ['Java', 'Concurrency']
---

## 핵심 요약

- **synchronized**: 임계 구역의 **원자성 + 가시성** 보장. 락 + happens-before.
- **volatile**: **가시성 + 순서 보장**. 원자성 X.
- 단순한 플래그는 volatile, 복합 연산은 synchronized 또는 atomic 클래스.

## 멀티스레드의 3가지 문제

1. **원자성(Atomicity)**: 연산이 도중에 끊기지 않음. `i++`은 read-modify-write 3단계라 원자 X.
2. **가시성(Visibility)**: 한 스레드의 변경이 다른 스레드에 보임. CPU 캐시/레지스터 때문에 안 보일 수 있음.
3. **순서(Ordering)**: 컴파일러/CPU가 명령 재배치 → 다른 스레드가 본 순서가 코드 순서와 다를 수 있음.

## volatile

- 변수 읽기/쓰기를 **메인 메모리에서** 직접. 캐시 무효화.
- **happens-before**: volatile 쓰기 이전의 모든 동작은 그 변수 읽기 이후의 동작에서 보임.
- 원자성 보장 X → `volatile int counter; counter++;` 안전하지 않음.

좋은 사용 예:
```java
volatile boolean running = true;
// 다른 스레드: running = false;
// 워커: while(running) { ... }
```

## synchronized

- 임계 구역 진입 시 락 획득 → 다른 스레드 대기.
- 락 해제 시 happens-before로 변경사항을 다음 락 획득자에게 보장.
- 원자성 + 가시성 + 순서 모두 해결.

```java
synchronized (lock) { count++; }
// 또는 메서드 자체에
public synchronized void increment() { count++; }
```

## ReentrantLock

- `synchronized`의 대안. 더 세밀한 제어:
  - `tryLock(timeout)`: 시간 초과 시 포기.
  - `lockInterruptibly()`: 인터럽트 가능.
  - `Condition`: 다중 대기 큐.
  - **fair lock**: FIFO 순서 보장(성능 손해).
- `synchronized`는 JVM이 락 최적화(biased, 경량) 발전 → 단순 케이스는 충분.

## Atomic 클래스

`AtomicInteger`, `AtomicReference` 등. **CAS(Compare-And-Swap)** 기반 락프리.

```java
AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet(); // 원자적
```

- 락 없이 원자성. 경합이 적을 때 성능 우수.
- 경합이 심하면 spin 비용 증가 → `LongAdder`(분산 카운터) 고려.

## ThreadLocal

- 스레드별 독립 변수.
- 주의: 스레드 풀 환경에서 **이전 요청의 값이 남아 있음** → 누수 + 데이터 혼선. 사용 후 `remove()` 필수.

## Java Memory Model (JMM)

- happens-before 관계가 핵심.
- volatile, synchronized, final, Thread.start/join이 happens-before를 만듬.
- final 필드는 생성자 종료 시점에 다른 스레드에서 보임 보장.

## 자주 헷갈리는 디테일

- "volatile이면 동시성 문제 해결" — 가시성만 해결. `count++` 같은 read-modify-write는 여전히 위험.
- synchronized는 **같은 락 객체**여야 의미. 서로 다른 락이면 동시 진입.
- `String`이나 `Integer` 같은 흔한 객체를 락으로 쓰면 다른 코드와 충돌 가능 → 전용 락 객체.

## 면접 follow-up

- "DCL(Double-Checked Locking)에서 volatile이 왜 필요?" → 객체 생성 중간 상태(주소만 할당, 생성자 미완) 노출 방지.
- "synchronized와 ReentrantLock 선택 기준?" → 기본은 synchronized(JVM 최적화, 자동 해제). tryLock/Condition 필요하면 ReentrantLock.
- "AtomicInteger와 LongAdder 차이?" → 후자는 셀(cell)을 분산해 경합 감소. 합산은 약간 느리지만 throughput↑.
