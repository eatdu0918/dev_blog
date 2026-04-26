---
published: true
type: 'qna'
level: 'mid'
title: "@Transactional의 전파(Propagation) 옵션을 설명하고, 실무에서 자주 발생하는 함정을 알려주세요."
date: '2026-04-26'
categories: ['Spring', 'Transaction', 'Backend']
---

## 핵심 요약

Spring의 트랜잭션 전파는 "이미 진행 중인 트랜잭션이 있을 때 어떻게 합류할지"를 결정합니다. 현업에서 가장 자주 충돌하는 두 가지는 **AOP self-invocation**과 **REQUIRES_NEW에서의 커넥션 풀 데드락**입니다.

## 전파 옵션 짧은 정리

- `REQUIRED` (기본값): 기존 트랜잭션에 합류, 없으면 새로 시작.
- `REQUIRES_NEW`: 기존 트랜잭션을 일시 중단하고 별도 물리 트랜잭션을 시작. 외부 트랜잭션 롤백과 무관하게 커밋 가능.
- `NESTED`: SAVEPOINT 기반 부분 롤백. 외부가 롤백되면 같이 롤백됩니다.
- `MANDATORY` / `NEVER` / `SUPPORTS` / `NOT_SUPPORTED`: 흐름 제어 또는 트랜잭션 없는 호출을 강제하는 용도.

격리 수준(isolation)은 전파와 별개 축이지만, 면접에서 같이 묶어 묻는 경우가 많으니 같이 답변하면 좋습니다.

## 실무 함정 1: 같은 클래스 내부 호출은 트랜잭션이 안 걸린다

Spring의 트랜잭션은 **AOP 프록시** 위에서 동작합니다. 같은 빈의 메서드를 `this.someMethod()`로 부르면 프록시를 거치지 않기 때문에 `@Transactional`이 무시됩니다.

```java
@Service
class OrderService {
    public void place() {
        this.audit(); // 프록시를 거치지 않음 → @Transactional 무시
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void audit() { ... }
}
```

해결은 셋 중 하나입니다. (1) 클래스 분리해 빈 간 호출로 만들기, (2) `AopContext.currentProxy()`로 프록시 우회, (3) self-injection. 1번이 가장 깔끔하고 의도도 잘 드러납니다.

## 실무 함정 2: REQUIRES_NEW와 커넥션 풀 데드락

`REQUIRES_NEW`는 외부 트랜잭션을 잠시 멈추고 **새 커넥션**을 받아옵니다. 외부 트랜잭션이 이미 커넥션을 점유하고 있는 상태에서 모두가 한 번씩 더 커넥션을 요청하면, HikariCP의 모든 커넥션이 점유되어 대기가 무한히 길어지고 결국 timeout으로 터집니다.

대표적인 시그널이 "단건 요청은 잘 되는데 부하만 올리면 `Connection is not available, request timed out` 에러"입니다.

대응은 다음과 같이 풀어갑니다.

- 정말 별도 커밋이 필요한지 검증. 감사 로그 같은 부수효과는 트랜잭션 외부의 메시징(예: Outbox)으로 빼는 편이 안전합니다.
- 진짜 필요하면 풀 사이즈를 늘리는 게 아니라 **호출 그래프 깊이를 짧게** 유지하는 설계로 가야 합니다.
- 불가피하면 별도 DataSource를 두는 방식도 고려할 수 있습니다.

## 실무 함정 3: 체크 예외와 롤백 규칙

기본적으로 Spring은 **언체크 예외와 Error**에서만 롤백합니다. 체크 예외에서 롤백하려면 `@Transactional(rollbackFor = Exception.class)`를 명시해야 합니다. 외부 라이브러리의 체크 예외를 그대로 던져 올리는 코드는 의도치 않게 커밋되는 일이 흔합니다.

## 면접 follow-up

- "REQUIRED 안에 REQUIRED를 넣으면 어떻게 되죠?" → 같은 물리 트랜잭션에 합류, 안쪽에서 던진 RuntimeException은 `rollback-only`로 마킹되어 바깥이 커밋하려 해도 `UnexpectedRollbackException`이 납니다.
- "트랜잭션을 메시지 발행과 묶으려면?" → 2PC는 운영 부담이 크니 Outbox 패턴으로 atomic write + async publish가 정석입니다.
