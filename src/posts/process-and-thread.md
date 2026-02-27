---
title: "프로세스와 스레드의 본질: Node.js 코드로 직접 확인하며 배운 점"
date: "2026-02-27"
description: "추상적인 운영체제 개념인 프로세스와 스레드를 Node.js의 child_process와 worker_threads를 통해 직접 구현해보고 확인한 학습 과정을 공유합니다."
---

개발을 진행하다보면 '멀티 프로세스'나 '멀티 스레드'라는 단어를 자주 마주하게 됩니다. 처음에는 단순히 '동시에 여러 작업을 처리하는 기술' 정도로만 뭉뚱그려 이해하고 넘어갔습니다. 하지만 애플리케이션의 성능 최적화를 고민하거나, 백그라운드 데이터 처리 로직을 구현할 때 이 둘의 명확한 경계와 동작 방식을 이해하지 못하면 뜻하지 않은 병목이나 메모리 관리 문제에 직면할 수 있다는 점을 알게 되었습니다.

운영체제 전공 서적에서 나오는 추상적인 개념들을 넘어서, 제가 주로 사용하는 환경인 Node.js에서 이 둘이 실제로 어떻게 다르게 동작하는지 코드로 직접 검증해본 과정을 정리해 보았습니다.

<img src="/images/process_vs_thread.png" alt="프로세스와 스레드의 개념 시각화" style="max-width: 100%;" />
*프로세스라는 큰 컨테이너 안에 스레드들이 자원을 공유하며 동작하는 모습*

## 프로세스와 스레드의 본질적 차이

두 가지 개념의 핵심적인 차이는 '메모리 공간의 공유 여부'에 있었습니다. 

- **프로세스 (Process)**: 운영체제로부터 독립된 메모리 공간과 시스템 자원을 할당받아 실행되는 프로그램의 인스턴스입니다. 완전히 독립적이기 때문에 하나의 프로세스가 다운되더라도 다른 프로세스에는 영향을 주지 않지만, 프로세스 간에 통신(IPC)을 하려면 자원 소모가 큽니다.
- **스레드 (Thread)**: 하나의 프로세스 내부에서 실행되는 더 작은 실행 단위입니다. 동일한 프로세스 내에 존재하기 때문에 힙(Heap)과 같은 메모리 공간을 서로 공유합니다. 덕분에 통신과 컨텍스트 스위칭 비용이 적지만, 하나의 스레드에서 치명적인 오류가 발생하면 전체 프로세스가 종료될 수 있는 위험을 동반합니다.

## 코드로 직접 확인하기

이 이론적인 차이를 Node.js API를 통해 직접 실험해 보았습니다. Node.js는 기본적으로 싱글 스레드 런타임으로 알려져 있지만, 별도의 자식 프로세스를 생성하는 `child_process` 모듈과 동일 프로세스 내에 스레드를 생성하는 `worker_threads` 모듈을 모두 지원합니다.

다음의 코드를 통해 시스템이 할당하는 식별자인 PID(Process ID)와 스레드 ID가 어떻게 다르게 찍히는지 검증했습니다.

```javascript
import { Worker, isMainThread, threadId } from 'worker_threads';
import { fork } from 'child_process';
import process from 'process';

// 현재 실행 중인 맥락의 PID와 스레드 ID를 출력하기 위한 문자열
const executionCtx = `PID: ${process.pid}, Thread: ${threadId}`;

if (isMainThread && !process.env.IS_CHILD) {
  console.log(`[Main] 메인 실행 컨텍스트 (${executionCtx})`);
  
  // 1. 워커 스레드 생성 (같은 프로세스 내에서 별도로 동작)
  const worker = new Worker(new URL(import.meta.url));
  worker.on('message', (msg) => {
    console.log(`[Worker Thread 응답] ${msg}`);
  });

  // 2. 자식 프로세스 생성 (독립된 새로운 프로세스 할당)
  const child = fork(new URL(import.meta.url), [], {
    env: { ...process.env, IS_CHILD: 'true' }
  });
  
  child.on('message', (msg) => {
    console.log(`[Child Process 응답] ${msg}`);
  });

} else if (process.env.IS_CHILD === 'true') {
  // 자식 프로세스로 실행된 경우
  if (process.send) {
    process.send(`새로운 프로세스입니다. (${executionCtx})`);
    process.exit(0);
  }
} else {
  // 워커 스레드로 실행된 경우
  import('worker_threads').then(({ parentPort }) => {
    parentPort.postMessage(`새로운 스레드입니다. (${executionCtx})`);
    process.exit(0);
  });
}
```

위 코드를 직접 실행해본 결과 콘솔에 다음과 같이 출력되었습니다.

```text
[Main] 메인 실행 컨텍스트 (PID: 41388, Thread: 0)
[Worker Thread 응답] 새로운 스레드입니다. (PID: 41388, Thread: 1)
[Child Process 응답] 새로운 프로세스입니다. (PID: 10224, Thread: 0)
```

이 결과를 통해 이론으로만 접했던 사실을 명확하게 확인할 수 있었습니다. 
- 워커 스레드는 메인 로직과 **동일한 프로세스 ID(41388)**를 유지하면서 자신만의 스레드 ID(1)를 가졌습니다. 즉, 메모리 공간을 공유하고 있다는 증거입니다.
- 반면 자식 프로세스는 **완전히 새로운 프로세스 ID(10224)**를 부여받아 메인 프로세스와 물리적(운영체제 레벨)으로 격리되어 실행됨을 알 수 있었습니다.

## 고민의 흔적과 배움

단순히 두 개념의 정의를 외우는 것을 넘어 코드로 직접 증명해보는 과정은 매우 흥미로웠습니다. 

무거운 작업 처리가 필요할 때 언제 프로세스를 분리할지, 아니면 동일 자원 안에서 스레드만 쪼갤지 결정하는 것은 결국 '데이터 공유의 필요성'과 '안정성' 사이의 트레이드오프를 조율하는 과정이라는 것을 배웠습니다. 메모리가 철저히 분리되어 안전하게 백그라운드 작업을 격리하고 싶다면 자식 프로세스를, 무거운 CPU 연산을 처리하되 데이터를 빈번하게 공유해야 한다면 스레드를 선택하는 것이 합리적이라는 통찰을 얻게 되었습니다.

앞으로 대용량 데이터를 처리하거나 동시성이 요구되는 아키텍처를 설계할 때, 이러한 본질적인 이해가 훨씬 견고한 구조를 만드는 밑거름이 될 것이라 생각합니다.
