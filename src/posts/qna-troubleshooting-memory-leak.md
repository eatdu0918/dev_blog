---
published: true
type: 'qna'
level: 'mid'
title: "운영 중인 서버에서 메모리 누수가 의심될 때 어떻게 진단하시겠어요?"
date: '2026-04-26'
categories: ['Troubleshooting', 'Performance', 'JVM']
---

## 핵심 요약

증상부터 정의하고, **메트릭 → 힙덤프 → 코드** 순으로 좁혀 들어갑니다. 단순 GC 압박과 진짜 누수를 구분하는 게 첫 단계입니다.

## 1. 진짜 누수인지부터 가린다

같은 증상처럼 보이지만 다음 셋은 다릅니다.

- **GC 압박**: 트래픽 대비 힙이 작거나, GC 알고리즘이 워크로드와 안 맞음. 힙은 줄어들지만 자주 GC가 뜸.
- **점진적 누수**: 시간에 비례해 Old Gen이 계속 증가. Full GC를 돌려도 회수가 거의 없음. 결국 OOM.
- **순간 폭발**: 특정 요청이 큰 객체를 만들어 순간적으로 OOM. 누수가 아니라 single-request memory issue.

JVM이라면 **Old Gen 사용량 추이**를 며칠 동안 보면 답이 거의 나옵니다. 단조 증가면 누수, 톱니파면 정상에 가깝습니다.

## 2. 메트릭으로 좁히기

저는 보통 다음 순서로 봅니다.

- **Heap used / committed**: 트렌드.
- **GC pause / frequency**: 빈번해졌는지.
- **스레드 수**: ThreadLocal 누수, ExecutorService 누수의 흔한 신호.
- **DB 커넥션 수**: 열고 안 닫는 코드 추적.
- **Class 로딩 수**: 무한히 늘어나면 ClassLoader 누수(특히 핫 리로드 환경).

여기서 가설이 어느 정도 좁아지면 힙덤프로 넘어갑니다.

## 3. 힙덤프 분석

운영에서 힙덤프를 뜨려면 두 가지 방식이 있습니다.

- **OOM 직전 자동 덤프**: `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=...` 설정.
- **수동 덤프**: `jcmd <pid> GC.heap_dump <path>` 또는 `jmap -dump:live`. live 옵션은 GC를 트리거하므로 일시적 stall 주의.

뜬 힙덤프는 **Eclipse MAT**으로 보는 게 가장 무난합니다. 핵심은 **Dominator Tree**와 **Leak Suspects Report**입니다.

- 가장 큰 retained heap을 차지하는 객체가 누수 후보.
- 그 객체의 **GC root path**를 따라가면 "왜 회수 안 되는지"가 보입니다.
- 흔한 누수 패턴: 정적 컬렉션, 캐시(eviction 정책 없음), ThreadLocal, 리스너 미해제, ClassLoader 참조.

## 4. 자주 만나는 패턴 사례

- **ThreadLocal 누수**: 스레드 풀에서 ThreadLocal에 큰 객체를 넣고 `remove()`를 안 하면 스레드가 살아 있는 한 회수되지 않습니다. Spring의 `@Async`/Tomcat 워커에서 자주 발생.
- **Closure 누수(JS)**: 클로저가 큰 DOM 노드나 큰 객체를 캡쳐해 GC가 못 회수. Chrome DevTools의 Memory 패널에서 detached DOM 검색.
- **LRU 없는 캐시**: `ConcurrentHashMap`을 캐시로 쓰는데 eviction이 없으면 시간이 갈수록 폭발. Caffeine 같은 라이브러리로 교체.
- **HikariCP 커넥션 누수**: `leakDetectionThreshold` 설정 + 트랜잭션 경계 점검. 보통 try-with-resources 누락 또는 비동기 흐름에서 close 누락.

## 5. 사후 조치

- 단순히 힙을 늘려 시간을 버는 건 임시방편. 재발 방지를 위한 게이트가 필요합니다.
- **회귀 방지 테스트**: 누수 객체를 명시적으로 생성/회수하는 시나리오를 단위/부하 테스트로 추가.
- **모니터링 알람 강화**: Old Gen 사용량 임계 + 증가 추세 알람.
- **포스트모템 작성**: 무엇이, 왜, 어떻게 발견되었는지를 팀 위키에 남겨 같은 장애를 반복하지 않게.

## 면접 follow-up

- "Node.js라면 어떻게 하시겠어요?" → `--inspect`로 Chrome DevTools 연결, heap snapshot 비교(`Comparison` 뷰)로 증가 객체 추적. 또는 clinic.js doctor.
- "운영에 영향 안 주고 진단할 수 있나요?" → APM(Datadog, Pinpoint, Scouter)으로 거의 무중단 관찰 가능. 힙덤프는 stall이 있으니 트래픽 적은 시간대.
- "GC 알고리즘 변경을 고려하나요?" → JDK 17+이면 G1 디폴트, 큰 힙(수십 GB)이면 ZGC/Shenandoah로 pause를 잡을 수 있습니다.
