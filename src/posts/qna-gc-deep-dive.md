---
published: true
type: 'qna'
level: 'mid'
title: "GC는 어떻게 동작하고, 어떤 종류가 있나요? (JVM/V8)"
date: '2026-04-26'
categories: ['CS', 'Performance', 'Memory']
---

## Q1. GC는 어떻게 더 이상 안 쓰는 객체를 식별하나요?

**A.** 두 가지 방식이 있습니다.

- **참조 카운팅**: 각 객체가 자기를 참조하는 개수를 들고 있다가 0이 되면 회수. CPython이 이 방식. **순환 참조 회수 불가**라 별도 사이클 콜렉터 필요.
- **도달 가능성(Reachability) 트레이싱**: GC Root(스택 변수, 정적 필드, 활성 스레드)에서 그래프를 따라가 **닿으면 live, 못 닿으면 garbage**. JVM/V8이 이 방식. 순환 참조도 자연스럽게 회수.

---

## Q2. 세대별 가설이란 뭔가요?

**A.** "**대부분의 객체는 짧게 살고 죽는다**"는 경험적 관찰입니다. 이 가설을 활용해 메모리를 Young/Old로 분리하고 다르게 다룹니다.

- **Young**: 자주 GC, 빠른 알고리즘(copying).
- **Old**: 드물게 GC, 단편화 적은 알고리즘(mark-compact).
- Young에서 살아남아 일정 횟수를 넘으면 Old로 **promote**.

이 분리 덕분에 대부분의 객체를 매우 싸게 회수할 수 있습니다.

---

## Q3. JVM의 주요 GC 콜렉터는 어떻게 선택하나요?

**A.** 힙 크기와 pause time 요구로 결정합니다.

- **G1 GC**: Java 9+ 기본. 영역(region) 단위 회수. 목표 pause time을 지정할 수 있어 균형이 좋음.
- **ZGC / Shenandoah**: pause를 ms 이하로. 수십~수백 GB 힙에 적합. 동시 압축.
- **Parallel GC**: 처리량 우선. 배치 작업에 적합.
- **Serial GC**: 단일 코어/임베디드.

큰 힙 + 낮은 pause가 필요하면 ZGC, 일반 웹 서버는 G1로 충분합니다.

---

## Q4. V8(JavaScript)의 GC는 JVM과 어떻게 다른가요?

**A.** 영역 구조는 비슷하지만 알고리즘 구성이 다릅니다.

- **New Space**: Scavenger(copying). 두 반쪽을 번갈아 사용.
- **Old Space**: Mark-Sweep / Mark-Compact.
- **Orinoco**: V8 GC 코드네임. 대부분 작업을 **백그라운드 스레드**로 보내 메인 스레드 멈춤 최소화.
- Incremental + Concurrent + Parallel을 모두 활용.

Node.js에서는 `--max-old-space-size=4096` (MB)로 힙 한도를 조정할 수 있습니다.

---

## Q5. Stop-The-World는 무엇이고 왜 줄여야 하나요?

**A.** GC가 마킹/이동 시 모든 애플리케이션 스레드를 멈추는 시점입니다. 정확성을 위해 필요하지만 응답 시간을 망칩니다.

모던 GC가 STW를 줄이는 방법:
- **Concurrent**: GC 스레드가 mutator와 동시 실행.
- **Incremental**: GC 작업을 작게 쪼개 점진 수행.
- **Read/Write Barrier**: mutator 코드에 자동 삽입되어 GC와 협력.

결제/광고 입찰처럼 tail latency가 중요한 곳에서는 GC 선택과 튜닝이 SLA를 좌우합니다.

---

## Q6. "GC 있으니 메모리 신경 안 써도 된다"가 맞나요?

**A.** 잘못된 인식입니다. **메모리 누수는 GC 환경에서도 발생**합니다.

도달 가능하지만 **사용하지 않는** 객체는 회수되지 않습니다.

흔한 누수 원인:
- 정적 컬렉션이 계속 커짐.
- 글로벌 캐시 (eviction 정책 부재).
- 이벤트 리스너 미해제.
- 클로저가 큰 객체 보유.
- ThreadLocal 미정리(스레드 풀 환경).

---

## Q7. 메모리 누수를 어떻게 디버깅하시나요?

**A.** 흐름이 정해져 있습니다.

1. **메트릭으로 추세 확인**: heap usage가 우상향이면 누수.
2. **힙 덤프**: 일정 시점 두 번 떠서 비교.
3. **도미네이터 트리 분석**: Eclipse MAT, Chrome DevTools.
4. **의심 GC root 추적**: 누가 큰 객체를 잡고 있는가.

Node.js는 `node --inspect` + Chrome DevTools 메모리 탭, JVM은 jcmd/VisualVM/MAT 사용.

---

## Q8. WeakReference와 finalizer는 언제 쓰나요?

**A.**
- **WeakReference**: 캐시에서 유용. GC가 회수할 수 있는 약한 참조. 다만 언제 회수될지는 보장 없음.
- **finalizer / `Object.finalize`**: **사용 금지에 가까움**. 실행 시점/순서가 비결정적이고 성능도 나쁨.

자원 해제는 finalizer 대신 **try-with-resources(Java)** 나 **using(C#)** 같은 명시적 해제 패턴을 씁니다.

---

## Q9. G1과 ZGC를 비교하면 어떻게 다른가요?

**A.** 둘 다 영역 기반이지만 우선순위가 다릅니다.

| | G1 | ZGC |
|---|---|---|
| 목표 pause | 수~수십 ms | 1ms 이하 |
| 힙 크기 | ~수십 GB | 수백 GB+ |
| 압축 | STW에서 일부 | 동시(concurrent) |
| 처리량 | 높음 | G1보다 약간 낮음 |

일반 웹 서버는 G1로 충분하고, 대용량 캐시 서버나 빅데이터 워크로드는 ZGC가 유리합니다.
