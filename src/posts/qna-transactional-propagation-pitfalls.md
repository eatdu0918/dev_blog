---
published: true
type: 'qna'
level: 'mid'
title: "@Transactional의 전파(Propagation) 옵션을 설명하고, 실무에서 자주 발생하는 함정을 알려주세요."
date: '2026-04-26'
categories: ['Spring', 'Transaction', 'Backend']
---

## Q1. @Transactional의 전파 옵션은 어떤 게 있나요?

**A.** "**이미 진행 중인 트랜잭션이 있을 때 어떻게 합류할지**" 결정합니다.

- **`REQUIRED`**(기본): 기존 트랜잭션에 합류, 없으면 새로 시작.
- **`REQUIRES_NEW`**: 기존 트랜잭션을 일시 중단하고 별도 물리 트랜잭션 시작. 외부 롤백과 무관하게 커밋 가능.
- **`NESTED`**: SAVEPOINT 기반 부분 롤백. 외부가 롤백되면 같이 롤백.
- **`MANDATORY`/`NEVER`/`SUPPORTS`/`NOT_SUPPORTED`**: 흐름 제어용.

격리 수준(isolation)은 별개 축이지만 면접에서 같이 묻는 경우가 많습니다.

---

## Q2. 같은 클래스 내부 호출에서 @Transactional이 안 걸리는 이유는?

**A.** Spring 트랜잭션은 **AOP 프록시 기반**이라 `this.method()`는 프록시를 거치지 않기 때문입니다.

```java
@Service
class OrderService {
    public void place() {
        this.audit();  // ❌ @Transactional 무시
    }
    @Transactional(propagation = REQUIRES_NEW)
    public void audit() { ... }
}
```

해결 3가지:
1. **클래스 분리해 빈 간 호출로 만들기**(가장 깔끔, 의도 명확).
2. `AopContext.currentProxy()`로 프록시 우회.
3. self-injection.

대부분 1번이 답입니다.

---

## Q3. REQUIRES_NEW를 쓸 때 커넥션 풀 데드락이 발생할 수 있다고요?

**A.** 네. **외부 트랜잭션을 잠시 멈추고 새 커넥션을 받아오기** 때문에 발생합니다.

시나리오:
- 외부 트랜잭션이 커넥션 점유 중.
- 내부 `REQUIRES_NEW`가 새 커넥션 요청.
- 부하가 올라가면 풀의 모든 커넥션이 외부 트랜잭션에 잡혀 새 커넥션을 못 받음.
- 결국 `Connection is not available, request timed out`.

시그널: 단건은 잘 되는데 **부하만 올리면 timeout**.

---

## Q4. REQUIRES_NEW 데드락은 어떻게 해결하시나요?

**A.** 풀 사이즈를 늘리는 건 임시방편입니다. 근본 해결:

- **정말 별도 커밋이 필요한지 검증**: 감사 로그 같은 부수효과는 트랜잭션 외부 메시징(Outbox)으로 빼는 게 안전.
- **호출 그래프 깊이를 짧게** 유지하는 설계.
- 불가피하면 **별도 DataSource** 사용.

대부분의 경우 "이 작업이 정말 별도 트랜잭션이어야 하는가?"를 다시 묻는 것만으로 답이 보입니다.

---

## Q5. 체크 예외에서 롤백이 안 되는 이유는?

**A.** Spring 기본 정책이 **언체크 예외(`RuntimeException`)와 Error에서만 롤백**이기 때문입니다.

```java
@Transactional  // ❌ IOException 발생해도 커밋됨
public void save() throws IOException { ... }

@Transactional(rollbackFor = Exception.class)  // ✅
public void save() throws IOException { ... }
```

외부 라이브러리의 체크 예외를 그대로 던져 올리는 코드는 의도치 않게 커밋되는 사고가 흔합니다. **`rollbackFor` 명시**하거나 RuntimeException으로 변환해서 던지는 게 안전합니다.

---

## Q6. REQUIRED 안에 REQUIRED를 넣으면 어떻게 되나요?

**A.** **같은 물리 트랜잭션에 합류**합니다.

다만 안쪽에서 RuntimeException이 던져지면:
- 안쪽 트랜잭션이 `rollback-only`로 마킹.
- 바깥이 catch해서 커밋 시도해도 `UnexpectedRollbackException` 발생.

이 함정은 "내부에서 예외를 잡으면 처리되겠지"라는 가정이 깨지는 단골 사례입니다.

---

## Q7. NESTED와 REQUIRES_NEW는 어떻게 다른가요?

**A.** **외부와의 운명 공동체** 여부입니다.

- **NESTED**: SAVEPOINT 기반. 안쪽만 롤백 가능, 외부 롤백 시 같이 롤백. 같은 커넥션 공유.
- **REQUIRES_NEW**: 별도 물리 트랜잭션. 외부와 완전히 독립. 새 커넥션 사용.

NESTED는 부분 롤백이 필요한 경우(예: 일부 항목 실패해도 나머지는 커밋), REQUIRES_NEW는 외부와 무관하게 반드시 커밋해야 하는 경우(감사 로그 등)입니다.

---

## Q8. 트랜잭션과 메시지 발행을 묶고 싶을 때는?

**A.** **2PC는 운영 부담이 크므로 Outbox 패턴**이 정석입니다.

- 같은 트랜잭션에 비즈니스 데이터 + outbox 테이블 row 동시 INSERT.
- outbox publisher가 row를 읽어 메시지 큐에 발행.
- 컨슈머는 멱등 처리.

이 패턴으로 "DB 커밋 + 메시지 발행"이 atomic처럼 동작합니다. 분산 트랜잭션 없이 사실상 same effect를 얻을 수 있습니다.

---

## Q9. @Transactional은 private 메서드에 적용되나요?

**A.** **안 됩니다**. 프록시가 가로챌 수 없기 때문입니다.

- JDK Dynamic Proxy: 인터페이스에 정의된 public 메서드만.
- CGLIB: public 또는 protected. private은 안 됨.
- final 메서드/클래스: CGLIB이 상속 못 함.

내부 호출이 안 되는 이유와 같은 맥락입니다. **public 메서드 + 다른 빈에서 호출**해야 트랜잭션이 동작합니다.

---

## Q10. 트랜잭션 안에서 외부 API를 호출해도 되나요?

**A.** **위험합니다**. 가능하면 트랜잭션 밖으로 빼야 합니다.

위험:
- 외부 API 응답이 느리면 트랜잭션 + DB 락이 길어짐 → 다른 트랜잭션 대기.
- 외부 API 실패 시 롤백되어 호출 자체가 사라지지만 외부 시스템에는 부수효과가 남을 수 있음.

권장:
- 트랜잭션 안에서는 DB 작업만.
- 외부 API 호출은 트랜잭션 후 또는 메시지 큐를 통한 비동기 처리.
- 정말 트랜잭션 안에서 호출이 필요하면 짧은 timeout + 멱등성 + 보상 트랜잭션.
