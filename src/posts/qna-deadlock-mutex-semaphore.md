---
published: true
type: 'qna'
level: 'mid'
title: "데드락은 어떤 조건에서 발생하고, Mutex와 Semaphore는 무엇이 다른가요?"
date: '2026-04-26'
categories: ['CS', 'OS', 'Concurrency']
---

## 핵심 요약

- **데드락(Deadlock)**: 둘 이상의 스레드/트랜잭션이 서로의 자원을 기다리며 영원히 진행 못하는 상태.
- **Coffman 4조건**이 모두 성립할 때만 발생: 상호 배제 / 점유와 대기 / 비선점 / **순환 대기**. 하나라도 깨면 데드락 불가.
- **Mutex** = 1개 자원의 락(소유자 개념), **Semaphore** = N개 자원의 카운터(소유자 없음). 같아 보이지만 의미가 다름.

## 데드락 발생의 4조건 (Coffman)

1. **Mutual Exclusion**: 자원을 동시에 한 스레드만.
2. **Hold and Wait**: 자원을 쥔 채 다른 자원을 기다림.
3. **No Preemption**: OS/시스템이 강제로 빼앗을 수 없음.
4. **Circular Wait**: A→B, B→A처럼 순환.

실무 데드락은 거의 4번이 트리거. **락 획득 순서 일관성**만 강제해도 대부분 막힙니다.

## 예방 / 회피 / 탐지

- **예방(Prevention)**: 4조건 중 하나를 깸. 가장 흔한 방법은 "**모든 락을 정해진 순서로만 획득**". 두 락이 필요하면 항상 ID 작은 것부터.
- **회피(Avoidance)**: 자원 요청 시 안전 상태인지 검사(Banker's Algorithm). 실무 적용은 드묾.
- **탐지(Detection)**: 자원 그래프 주기 검사. DB는 wait-for graph로 데드락 탐지 후 한 트랜잭션 abort + 재시도.
- **타임아웃**: 가장 단순한 안전망. tryLock(timeout) + 재시도.

## DB 데드락 (실무 빈출)

- 두 트랜잭션이 같은 행을 다른 순서로 갱신할 때.
- MySQL InnoDB의 **gap lock**으로 인한 데드락이 잦음.
- 해결:
  1. 같은 순서로 행 잠금(예: `ORDER BY id`).
  2. 짧은 트랜잭션 + 빠른 커밋.
  3. 격리 수준 낮춤(REPEATABLE READ → READ COMMITTED).
  4. SELECT FOR UPDATE 범위 최소화.

## Mutex vs Semaphore

### Mutex (Mutual Exclusion)

- 자원 1개를 보호. **소유자 개념** 있음 → 락을 건 스레드만 풀 수 있음.
- 재진입(reentrant) 여부는 종류별. ReentrantLock(자바), pthread_mutex의 RECURSIVE.
- 우선순위 역전(Priority Inversion) 회피용 priority inheritance 지원하는 구현도 있음.

### Semaphore

- 카운터(N). `wait/P`로 1 감소(0이면 대기), `signal/V`로 1 증가.
- 소유자 개념 없음. **다른 스레드가 풀어도 됨** → 커넥션 풀, 동시 처리 한도 같이 "**자원 N개 분배**" 모델.
- 이진 세마포어(N=1)는 mutex와 비슷해 보이지만 소유자 개념이 없는 점에서 다름. 실수로 영원히 풀리지 않을 위험.

### 언제 무엇을

- 임계 구역(공유 변수 보호) → **Mutex**.
- 자원 풀의 동시 사용 한도 → **Semaphore**.
- 조건에 따라 깨우기 → **Condition Variable** + Mutex.

## 다른 동기화 도구

- **Spinlock**: 짧은 임계 구역에서 sleep 대신 busy wait. 컨텍스트 스위칭 비용 회피.
- **RWLock**: 읽기 다수 동시 허용 + 쓰기 단독. 읽기 비율 높을 때 유리. **Writer starvation** 주의.
- **Atomic operations / CAS**: 락 없이 메모리 일관성. 락프리 자료구조의 기반.
- **Monitor**: 객체에 락이 묶인 추상화. 자바의 `synchronized`.

## 라이브락 / 기아

- **Livelock**: 서로 양보만 하다가 진행 못함. 데드락은 멈춤, 라이브락은 분주하게 멈춤.
- **Starvation(기아)**: 우선순위/스케줄링 때문에 특정 스레드가 영원히 자원 못 얻음. fair lock 또는 큐 기반 락으로 완화.

## 자주 헷갈리는 디테일

- 이진 세마포어 ≠ 뮤텍스. **소유자 개념**이 없으므로 ISR이나 다른 스레드가 풀어도 됨 → 사용 패턴이 다름.
- "락을 잘게 쪼개면 무조건 빠르다" → 락 획득 비용 + 데드락 가능성 증가. 측정 후 결정.
- 데드락은 락만의 문제가 아님. 비동기 콜백 체인, 메시지 큐, 외부 시스템 호출에서도 순환 대기로 발생.

## 면접 follow-up

- "DB 데드락을 방지한 경험?" → 락 순서 통일 + 트랜잭션 짧게 + 인덱스 점검(불필요한 풀 스캔이 갭 락 폭증).
- "synchronized와 ReentrantLock 차이?" → ReentrantLock은 tryLock, fair, condition 분리, lockInterruptibly 같은 세밀한 제어. JVM 락 최적화도 발전해 단순 케이스는 synchronized로 충분.
- "락프리(lock-free) 자료구조의 의미?" → 시스템이 진행을 보장(어떤 스레드는 반드시 진행). CAS 기반. 대신 ABA 문제 등 고려 사항.
