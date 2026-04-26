---
published: true
type: 'qna'
level: 'mid'
title: "GC는 어떻게 동작하고, 어떤 종류가 있나요? (JVM/V8)"
date: '2026-04-26'
categories: ['CS', 'Performance', 'Memory']
---

## 핵심 요약

- GC의 본질은 "**더 이상 참조되지 않는 객체 식별 → 메모리 회수**".
- 식별 방식은 크게 **참조 카운팅** vs **도달 가능성(Reachability) 기반 트레이싱**. 모던 런타임은 거의 트레이싱 + Mark-Sweep-Compact + 세대별 가설.
- **세대별 가설**: 대부분의 객체는 짧게 살고 죽는다. → Young/Old 영역 분리 + Young은 자주, Old는 드물게.

## 도달 가능성과 GC Roots

루트(스택 변수, 정적 필드, 활성 스레드, JNI 핸들 등)에서 참조 그래프를 따라가 **닿는 객체 = live**, 못 닿는 객체 = garbage.

순환 참조도 루트에서 못 닿으면 회수. 참조 카운팅 방식(예: CPython)은 순환 참조에 별도 사이클 콜렉터 필요.

## 기본 알고리즘

- **Mark-Sweep**: live를 마킹 후 나머지 회수. 단편화 발생.
- **Mark-Compact**: 마킹 + 살아있는 객체를 한쪽으로 모아 단편화 제거. 이동 비용 큼.
- **Copying**: 두 영역을 두고 살아있는 것만 다른 쪽으로 복사. 빠르지만 메모리 절반 사용.
- **Generational**: 위 알고리즘들을 세대별로 다르게 적용.

## JVM GC

영역: **Young(Eden + Survivor 0/1) | Old | Metaspace**.

- **Minor GC**: Young만. 대부분 객체는 여기서 죽음. Eden에서 살아남으면 Survivor → 일정 횟수 후 Old로 promote.
- **Major / Full GC**: Old 또는 전체. 길고 비쌈.

### 콜렉터 선택

- **G1 GC**: Java 9+ 기본. 영역(region)을 잘게 쪼개고 가장 garbage 많은 region 우선 회수. **목표 pause time** 지정 가능.
- **ZGC / Shenandoah**: pause time을 ms 이하로. 큰 힙(수십~수백 GB)에 적합. 동시 압축.
- **Parallel GC**: 처리량 우선, 배치 작업.
- **Serial GC**: 단일 코어/임베디드.

### 튜닝의 시작점

1. 힙 크기(`-Xms = -Xmx`로 동일하게).
2. GC 로그(`-Xlog:gc*`)로 pause/주기 측정.
3. Old promotion이 너무 잦으면 Young 키우기.
4. 메모리 누수 의심 → 힙 덤프 + MAT 분석.

## V8 GC (JavaScript)

영역: **Young(New Space) | Old(Old Space) | Large Object Space | Code Space**.

- **Scavenger**: New Space에서 작동. 두 반쪽을 두고 copying.
- **Mark-Sweep / Mark-Compact**: Old Space.
- **Incremental, Concurrent, Parallel**: 메인 스레드 멈춤 최소화.
- **Orinoco**: V8의 GC 코드네임. 대부분의 작업을 백그라운드 스레드로.

### Node.js 튜닝

- `--max-old-space-size=4096` (MB)로 힙 한도. 기본은 환경에 따라 작음.
- 메모리 누수: Chrome DevTools + `node --inspect` 힙 스냅샷.
- 흔한 누수: 클로저가 큰 객체 보유, 글로벌 캐시, 이벤트 리스너 미해제.

## STW (Stop-The-World)

마킹/이동 시 정확성을 위해 모든 mutator를 멈춤. 모던 GC는 이를 ms 이하로 줄이려 노력.

- **Concurrent**: GC 스레드가 mutator와 동시에 실행.
- **Incremental**: GC 작업을 작게 쪼개서 점진 수행.
- **Read/Write Barrier**: mutator 코드에 자동 삽입되어 GC와 협력. 비용은 들지만 STW 회피.

## "GC가 있으니 메모리 신경 안 써도 된다"는 환상

- **메모리 누수는 여전히 발생**. 도달 가능하지만 **사용하지 않는** 객체는 회수 안 됨.
- 정적 컬렉션, 전역 캐시, 이벤트 리스너, 클로저, ThreadLocal — 자주 누수 원인.
- GC pause는 **레이턴시 SLA**의 적. 결제/광고 입찰처럼 tail latency 중요한 곳에선 GC 선택과 튜닝이 핵심.

## 자주 헷갈리는 디테일

- "GC = 느림"은 단순화. 짧은 객체가 많을 때 모던 GC는 malloc/free보다 빠를 수 있음.
- finalizer / `Object.finalize`는 **사용 금지에 가까움**. 실행 시점/순서 비결정. 자원 해제는 try-with-resources / using.
- WeakReference는 캐시에서 유용. 다만 도달 가능성과 별개로 GC가 언제 회수할지 보장 없음.

## 면접 follow-up

- "G1과 ZGC를 어떻게 선택?" → 힙 크기와 pause time 요구. 큰 힙 + 낮은 pause = ZGC.
- "메모리 누수 디버깅 흐름?" → 메트릭으로 추세 확인 → 힙 덤프 → 도미네이터 트리 분석 → 의심 GC root 추적.
- "참조 카운팅의 단점?" → 순환 참조 회수 불가, 참조 변경 시마다 카운터 갱신 비용, 멀티스레드 원자 연산 비용.
