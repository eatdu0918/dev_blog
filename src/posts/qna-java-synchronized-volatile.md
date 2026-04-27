---
published: true
type: 'qna'
level: 'mid'
title: "Java의 synchronized와 volatile은 무엇이 다른가요?"
date: '2026-04-27'
categories: ['Java', 'Concurrency']
---

## Q1. 멀티스레드 환경의 핵심 문제 3가지는 무엇인가요?

**A.** 동시성을 이해하려면 이 셋부터 분리해야 합니다.

1. **원자성(Atomicity)**: 연산이 도중에 끊기지 않음. `i++`은 read-modify-write 3단계라 원자 X.
2. **가시성(Visibility)**: 한 스레드 변경이 다른 스레드에 보임. CPU 캐시/레지스터 때문에 안 보일 수 있음.
3. **순서(Ordering)**: 컴파일러/CPU가 명령 재배치 → 다른 스레드가 본 순서가 코드와 다를 수 있음.

`synchronized`는 셋 다 해결, `volatile`은 가시성 + 순서만 해결합니다.

---

## Q2. volatile은 무엇을 보장하나요?

**A.** **가시성과 순서**입니다.

- 변수 읽기/쓰기를 메인 메모리에서 직접 → CPU 캐시 무효화.
- volatile 쓰기 이전의 모든 동작은 그 변수 읽기 이후 동작에서 보임(happens-before).

```java
volatile boolean running = true;
// 다른 스레드: running = false;
// 워커: while(running) { ... }
```

**원자성은 보장 안 함**. `volatile int counter; counter++;`는 안전하지 않습니다.

---

## Q3. synchronized는 무엇을 보장하나요?

**A.** **원자성 + 가시성 + 순서 모두**입니다.

```java
synchronized (lock) { count++; } // 락 + happens-before
```

락 획득 시 다른 스레드 대기, 해제 시 변경사항이 다음 락 획득자에게 보입니다.

주의: **같은 락 객체**여야 의미가 있습니다. 서로 다른 락이면 동시 진입합니다. `String`이나 `Integer` 같은 흔한 객체를 락으로 쓰면 다른 라이브러리 코드와 충돌 가능 → 전용 객체(`private final Object lock = new Object();`)를 만듭니다.

---

## Q4. synchronized와 ReentrantLock 중 무엇을 선택하시나요?

**A.** **기본은 `synchronized`**입니다. JVM이 biased lock, 경량 lock 등 최적화를 잘 해줘서 단순 케이스는 충분합니다.

`ReentrantLock`이 필요한 경우:
- **`tryLock(timeout)`**: 데드락 회피.
- **`lockInterruptibly()`**: 인터럽트 가능.
- **`Condition`**: 다중 대기 큐.
- **fair lock**: FIFO 순서 보장(공정성).

`synchronized`는 자동 해제(블록 벗어나면 풀림), `ReentrantLock`은 명시적 `unlock()` 필요해 finally 블록 필수.

---

## Q5. AtomicInteger 같은 Atomic 클래스는 어떻게 동작하나요?

**A.** **CAS(Compare-And-Swap)** 기반 락프리 연산입니다.

```java
AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet(); // 원자적
```

CAS는 "현재 값이 예상값과 같으면 새 값으로 교체"를 한 번에. 락 없이 원자성을 얻습니다.

- 경합이 적을 때 성능 우수.
- 경합이 심하면 CAS 실패 + retry로 spin 비용 증가.

---

## Q6. AtomicInteger와 LongAdder는 어떻게 다른가요?

**A.** **경합 분산** 방식이 다릅니다.

- **AtomicInteger**: 단일 변수에 모두 CAS. 경합이 심하면 retry 폭증.
- **LongAdder**: 여러 셀(cell)에 분산해서 더하고, `sum()` 호출 시 합산. **throughput 압도적 우수**.

대신 `sum()`이 약간 느리고, 연속적인 정확한 카운트 읽기에는 부적합. 통계 카운터 같은 워크로드에 적합합니다.

---

## Q7. ThreadLocal은 어떤 함정이 있나요?

**A.** **스레드 풀 환경에서 이전 요청 값이 남는 것**이 가장 흔한 함정입니다.

스레드가 풀에 반납되어도 ThreadLocal 값은 남아 있어 다음 요청이 그 값을 보게 됩니다 → 데이터 혼선 + 메모리 누수.

해결: **사용 후 반드시 `remove()`**. 보통 try-finally로 보장.

```java
try {
    ThreadLocalContext.set(value);
    // ...
} finally {
    ThreadLocalContext.remove();
}
```

---

## Q8. DCL(Double-Checked Locking)에서 volatile이 왜 필요한가요?

**A.** **객체 생성 중간 상태가 노출되는 것을 방지**하기 위해서입니다.

```java
class Singleton {
    private static volatile Singleton instance; // ← volatile 필수
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) instance = new Singleton();
            }
        }
        return instance;
    }
}
```

`instance = new Singleton()`은 (1) 메모리 할당 (2) 생성자 실행 (3) 참조 대입의 3단계인데, 컴파일러/CPU가 (3)을 (2)보다 먼저 실행할 수 있습니다. volatile이 이 재배치를 막아 **완전히 생성된 객체만** 다른 스레드에 보이게 합니다.

---

## Q9. Java Memory Model의 happens-before 관계는 무엇인가요?

**A.** "**A가 B 이전에 일어났다고 보장되는 관계**"를 정의합니다. 이 관계가 있어야 A의 결과가 B에서 보인다고 보장됩니다.

happens-before를 만드는 것:
- volatile 쓰기 → 같은 변수의 후속 읽기.
- synchronized 해제 → 같은 락의 후속 획득.
- `Thread.start()` → 그 스레드의 모든 동작.
- `Thread.join()` → 종료된 스레드의 모든 동작.
- final 필드 → 생성자 종료 후 다른 스레드.

이 관계를 의식하면 동시성 코드의 정확성을 추론할 수 있습니다.
