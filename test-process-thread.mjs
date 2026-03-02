import { Worker, isMainThread, threadId } from 'worker_threads';
import { fork } from 'child_process';
import process from 'process';

// 현재 실행 중인 맥락의 PID와 스레드 ID
const executionCtx = `PID: ${process.pid}, Thread: ${threadId}`;

if (isMainThread && !process.env.IS_CHILD) {
  console.log(`[Main] 메인 실행 컨텍스트 (${executionCtx})`);
  
  // 1. 워커 스레드 생성 (같은 프로세스(PID) 내에서 별도의 스레드로 동작)
  const worker = new Worker(new URL(import.meta.url));
  worker.on('message', (msg) => {
    console.log(`[Worker Thread의 응답] ${msg}`);
  });

  // 2. 자식 프로세스 생성 (독립된 메모리 공간과 새로운 PID 할당)
  const child = fork(new URL(import.meta.url), [], {
    env: { ...process.env, IS_CHILD: 'true' }
  });
  
  child.on('message', (msg) => {
    console.log(`[Child Process의 응답] ${msg}`);
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
