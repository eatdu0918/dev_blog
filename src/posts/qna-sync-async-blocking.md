---
published: true
type: 'qna'
level: 'mid'
title: "동기/비동기와 블로킹/논블로킹의 차이를 설명해 주세요"
date: '2026-04-26'
categories: ['CS', 'OS', 'Concurrency']
---

## Q1. 동기/비동기와 블로킹/논블로킹은 같은 개념인가요?

**A.** **다른 축**입니다. 자주 혼동되지만 4가지 조합이 모두 가능합니다.

- **블로킹 vs 논블로킹**: 호출자가 결과를 **기다리며 멈추는가**? (제어가 즉시 돌아오는가)
- **동기 vs 비동기**: 호출자가 결과를 **누가 챙기는가**? (호출자가 직접 vs 콜백/이벤트로 받음)

| | 블로킹 | 논블로킹 |
|---|---|---|
| **동기** | `read()`가 데이터 올 때까지 멈춤 | `read()`가 즉시 반환, 호출자가 polling으로 확인 |
| **비동기** | 거의 없음(드문 경우) | epoll/io_uring + 콜백. Node.js, Netty 모델 |

---

## Q2. 4가지 조합의 구체적 예시를 들어 주세요.

**A.**

- **동기 블로킹**: `data = file.read()` — 읽을 때까지 멈춤. 가장 흔함.
- **동기 논블로킹**: 소켓을 `O_NONBLOCK` 설정 후 `read()` → 즉시 반환. 안 왔으면 직접 다시 폴링.
- **비동기 블로킹**: select 같은 다중화. 콜백을 등록해 두지만 select 자체는 블록.
- **비동기 논블로킹**: epoll/kqueue/io_uring + 콜백. 가장 효율적.

---

## Q3. 웹 서버의 동시성 모델은 어떻게 갈리나요?

**A.** 3가지 모델이 있습니다.

- **Thread-per-request(동기 블로킹)**: 톰캣 기본. 직관적이지만 **스레드 수 = 동시 처리 한계**.
- **이벤트 루프(비동기 논블로킹)**: Node.js, Netty. 스레드 1~수개로 수만 커넥션. 단 한 콜백이 CPU를 잡으면 전체 멈춤.
- **코루틴 / virtual thread**: 코드는 블로킹처럼 짜고 런타임이 비블로킹으로 변환. Go, Kotlin, Java 21+.

---

## Q4. 코루틴/virtual thread가 가져온 변화는?

**A.** **"동기 블로킹의 가독성 + 비동기의 효율"** 절충입니다.

```kotlin
// 코드는 블로킹처럼 보이지만 실제로는 협력 스케줄링
suspend fun fetchUser(): User {
    val data = client.get("/api/user")
    return parse(data)
}
```

이벤트 루프 콜백 지옥 없이도 수십만 동시성. Java 21의 virtual thread는 기존 Thread API 그대로 쓸 수 있어 마이그레이션 부담이 작습니다.

주의: **블로킹 시스템콜**(synchronized 안에서, 또는 JNI 호출)을 그대로 하면 OS 스레드까지 막혀 다른 코루틴이 멈춤.

---

## Q5. Linux의 I/O 다중화 모델은 어떻게 발전했나요?

**A.** **select → poll → epoll → io_uring** 순.

- **select / poll**: 모든 fd를 매번 스캔, O(n). 작은 규모.
- **epoll**(Linux), **kqueue**(BSD): 변경된 fd만 리포트, O(1). 대규모 커넥션에 적합.
- **io_uring**: 커널-유저 공유 링 버퍼로 시스템콜 비용 감소, 진정한 비동기 I/O.

C10K, C10M 문제를 풀어온 역사이기도 합니다.

---

## Q6. JavaScript의 async/await는 어떤 모델인가요?

**A.** **비동기 논블로킹**입니다. Promise의 syntactic sugar.

```javascript
async function fetchUser() {
  const res = await fetch('/api/user');  // await 지점에서 함수 일시 정지
  return res.json();
}
```

코드는 동기처럼 보이지만 await 지점에서 함수가 정지되고 이벤트 루프가 다른 일을 처리합니다. Promise 해결되면 마이크로태스크로 재개.

---

## Q7. "비동기는 무조건 빠르다"가 맞나요?

**A.** **잘못된 일반화**입니다.

- **CPU 바운드 작업**: 비동기로 가도 의미 없음. CPU가 비는 시간이 없음.
- **I/O 바운드 작업**: I/O 대기 시간을 다른 일로 채울 수 있어 비동기가 가치.

Node.js로 무거운 이미지 처리를 하면 메인 스레드를 막아 모든 요청이 멈춥니다. 이때는 worker_threads 또는 별도 워커 프로세스로 오프로드해야 합니다.

---

## Q8. Java의 CompletableFuture와 Reactive(Mono/Flux)는 어떻게 다른가요?

**A.**
- **CompletableFuture**: 단일 값 비동기. 단순한 비동기 결과 표현.
- **Reactive(Mono/Flux)**: 스트림 + **백프레셔**(backpressure). 다수 값과 흐름 제어.

웹플럭스의 핵심은 단순 비동기가 아니라 **백프레셔로 데이터 흐름 자체를 제어**하는 것입니다. 다만 학습 곡선이 가팔라 virtual thread + 동기 코드 조합이 더 단순한 선택으로 부상했습니다.

---

## Q9. 어떤 환경에서 어떤 동시성 모델을 선택하시나요?

**A.**

- **단순한 사내 시스템, RPS 낮음**: thread-per-request. 디버깅 쉬움.
- **고성능 게이트웨이/프록시**: 이벤트 루프(Netty, Nginx).
- **많은 동시성 + 가독성 양립**: virtual thread / 코루틴.
- **CPU 바운드 워커**: 멀티프로세스 + 큐.

"트렌드"가 아니라 워크로드 특성으로 결정하는 게 좋습니다.

---

## Q10. 이벤트 루프에서 무거운 동기 함수가 들어오면 어떻게 되나요?

**A.** **모든 콜백이 지연**됩니다. 같은 스레드를 공유하므로 한 콜백이 CPU를 1초 잡으면 다른 모든 요청이 1초 늦어집니다.

해결:
- **CPU 작업은 별도 스레드/프로세스로 오프로드**: Node.js의 worker_threads, cluster.
- **작업 분할 + yield**: `setImmediate`, `scheduler.yield()`로 매크로태스크 사이에 다른 콜백 처리 기회.
- **모니터링**: long task 감지(이벤트 루프 lag 측정).

이벤트 루프 모델의 가장 큰 함정이라 운영에서 메트릭으로 항상 추적해야 합니다.
