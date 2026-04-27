---
published: true
type: 'qna'
level: 'mid'
title: "운영 중인 서버에서 메모리 누수가 의심될 때 어떻게 진단하시겠어요?"
date: '2026-04-26'
categories: ['Troubleshooting', 'Performance', 'JVM']
---

## Q1. 메모리 누수가 의심되면 가장 먼저 무엇을 확인하시나요?

**A.** **진짜 누수인지 GC 압박인지 구분**합니다. 같은 증상처럼 보여도 셋은 다릅니다.

- **GC 압박**: 트래픽 대비 힙이 작거나 GC 알고리즘이 안 맞음. 힙은 줄어들지만 GC가 자주 뜸.
- **점진적 누수**: Old Gen이 계속 증가. Full GC를 돌려도 회수 거의 없음. 결국 OOM.
- **순간 폭발**: 특정 요청이 큰 객체를 만듦. 누수가 아니라 single-request issue.

**Old Gen 사용량 추이**를 며칠 보면 답이 거의 나옵니다. 단조 증가면 누수, 톱니파면 정상.

---

## Q2. 메트릭으로 누수를 좁히는 순서가 어떻게 되나요?

**A.** 5가지를 차례로 봅니다.

1. **Heap used / committed**: 추세.
2. **GC pause / frequency**: 빈번해졌는지.
3. **스레드 수**: ThreadLocal/ExecutorService 누수의 흔한 신호.
4. **DB 커넥션 수**: 열고 안 닫는 코드.
5. **Class 로딩 수**: 무한 증가면 ClassLoader 누수.

여기서 가설이 좁혀지면 힙덤프로 넘어갑니다.

---

## Q3. 힙덤프는 어떻게 뜨고 분석하나요?

**A.** 운영에서는 두 가지 방법.

- **OOM 직전 자동**: `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=...`.
- **수동**: `jcmd <pid> GC.heap_dump <path>` 또는 `jmap -dump:live` (live는 GC 트리거되므로 stall 주의).

분석 도구: **Eclipse MAT**.
- **Dominator Tree**: 가장 큰 retained heap 객체.
- **Leak Suspects Report**: 자동 의심 후보 추출.
- **GC root path**: 왜 회수 안 되는지 추적.

---

## Q4. 흔한 메모리 누수 패턴은 어떤 게 있나요?

**A.** 4가지가 자주 보입니다.

1. **ThreadLocal 미정리**: 스레드 풀 환경에서 `remove()` 안 하면 스레드 살아있는 한 회수 X.
2. **eviction 없는 캐시**: `ConcurrentHashMap` 캐시가 무한 증가. **Caffeine** 같은 라이브러리로 교체.
3. **이벤트 리스너 미해제**: 등록만 하고 unregister 안 함.
4. **HikariCP 커넥션 누수**: `leakDetectionThreshold` 설정 + 트랜잭션 경계 점검.

---

## Q5. ThreadLocal 누수를 어떻게 진단하시나요?

**A.** **스레드별 retained heap을 추적**합니다.

스레드 풀(Tomcat, `@Async`)에서:
- 스레드가 풀에 반납되어도 ThreadLocal 값은 유지.
- 다음 요청에서 해당 스레드가 재사용되면 값이 남아 있음 → 누수 + 데이터 혼선.

해결:
- **try-finally로 `ThreadLocal.remove()` 보장**.
- 프레임워크 제공 컨텍스트(`MDC`, Spring `RequestContextHolder`) 사용 시 cleanup이 자동인지 확인.

---

## Q6. JavaScript/Node.js에서 메모리 누수는 어떻게 진단하나요?

**A.** **Chrome DevTools Memory 패널**이 정공법입니다.

1. `node --inspect`로 디버거 연결.
2. **Heap snapshot 비교**: 일정 시간 간격으로 두 번, "Comparison" 뷰로 증가 객체 확인.
3. retainer 추적: 어떤 클로저/객체가 잡고 있는지.

브라우저는 **detached DOM** 검색이 효과적(이벤트 리스너 + DOM 참조 클로저). `clinic.js doctor`도 Node.js에 좋은 도구입니다.

---

## Q7. 단순히 힙을 늘리는 건 왜 임시방편인가요?

**A.** 누수는 **시간이 지나면 어떤 크기든 채웁니다**.

힙 4GB가 8GB로 가도:
- 누수 속도가 느려질 뿐 결국 OOM.
- 다음번에는 16GB로? 비현실적.
- GC pause는 힙이 클수록 더 길어짐.

근본 해결은 **누수 코드 수정 + 회귀 방지 테스트 + 모니터링 알람 강화**입니다.

---

## Q8. 운영에 영향 없이 진단하는 방법이 있나요?

**A.** 가능합니다.

- **APM**(Datadog, Pinpoint, Scouter, NewRelic): 거의 무중단 관찰. 힙 사용량, GC, 스레드 추세.
- **JFR(Java Flight Recorder)**: 낮은 오버헤드(<2%)로 운영 중 프로파일링.
- **`jstat`**: 가벼운 GC 통계.

힙덤프는 stall이 있으므로 **트래픽 적은 시간대 + 한 인스턴스에만** 적용하는 게 안전합니다.

---

## Q9. GC 알고리즘 변경을 고려할 시점은?

**A.** **pause time SLA를 못 맞출 때**입니다.

- JDK 17+: G1 디폴트로 충분.
- **수십~수백 GB 힙** + **ms 이하 pause 필요**: ZGC/Shenandoah.
- **배치 작업**: Parallel GC.

알고리즘 변경 전에 **힙 크기 + Young/Old 비율 + 통계 갱신** 같은 일반 튜닝을 먼저 해보는 게 순서입니다.

---

## Q10. 누수 사고 후 어떤 사후 조치를 하시나요?

**A.** 4가지를 챙깁니다.

1. **회귀 방지 테스트**: 누수 객체를 생성/회수하는 시나리오를 부하 테스트로.
2. **모니터링 알람 강화**: Old Gen 사용량 임계 + 증가 추세 알람.
3. **포스트모템 작성**: 무엇이/왜/어떻게 발견됐는지 팀 위키에.
4. **유사 패턴 점검**: 같은 코드 패턴이 다른 곳에도 있는지 grep.

이 절차가 없으면 같은 사고가 반복됩니다. 사고는 "이번만 막는" 것이 아니라 "다음을 막는" 데이터로 써야 합니다.
