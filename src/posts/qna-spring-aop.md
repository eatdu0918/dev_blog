---
published: true
type: 'qna'
level: 'mid'
title: "Spring AOP는 어떻게 동작하고 언제 쓰나요?"
date: '2026-04-27'
categories: ['Spring', 'Backend']
---

## Q1. AOP가 무엇이고 왜 쓰나요?

**A.** **Aspect-Oriented Programming**: 횡단 관심사(cross-cutting concerns)를 비즈니스 코드에서 분리하는 패러다임입니다.

트랜잭션, 로깅, 인증, 캐싱 같이 **여러 클래스에 반복되는 로직**을 한 곳에 모아 적용합니다. Spring에서 `@Transactional`을 붙이면 자동으로 트랜잭션 처리가 되는 게 AOP 덕분입니다.

---

## Q2. AOP의 핵심 용어를 정리해 주세요.

**A.**

- **Aspect**: 횡단 관심사 묶음.
- **Join Point**: 적용 가능한 지점(Spring AOP는 메서드 호출).
- **Pointcut**: Join Point 중 어디에 적용할지 표현식.
- **Advice**: 실제 실행될 코드(`@Before`, `@Around` 등).
- **Weaving**: Aspect를 대상에 적용하는 과정.

면접에서 단어 외우기보다 "프록시가 메서드를 가로채서 추가 로직을 실행한다"는 흐름을 먼저 설명하는 게 좋습니다.

---

## Q3. Spring AOP는 어떻게 구현되나요?

**A.** **프록시 기반(런타임 생성)** 입니다.

두 가지 프록시:
- **JDK Dynamic Proxy**: 인터페이스 기반. 인터페이스 구현체에 적용.
- **CGLIB**: 클래스 상속 기반. 인터페이스 없을 때. Spring Boot 2.x+ 기본.

런타임에 빈을 감싸는 프록시 객체를 생성 → 클라이언트는 프록시를 호출 → Advice 실행 후 실제 메서드 호출.

---

## Q4. 자기 호출(self-invocation)이 AOP를 안 타는 이유는?

**A.** **`this.method()` 가 프록시를 거치지 않기** 때문입니다. 가장 자주 나오는 면접 질문이자 실무 함정.

```java
@Service
class A {
    public void outer() { this.inner(); }  // ❌ @Transactional 무시
    @Transactional
    public void inner() { ... }
}
```

해결:
- **다른 빈으로 분리**해서 호출.
- 자기 자신을 빈으로 주입: `applicationContext.getBean(A.class).inner()`.
- **AspectJ 위빙** 사용(런타임 프록시 우회).

---

## Q5. @Transactional이 안 먹히는 다른 케이스는?

**A.** 4가지가 자주 나옵니다.

1. **자기 호출**: 위 Q4.
2. **`private` 메서드**: 프록시가 가로챌 수 없음.
3. **`final` 클래스/메서드**: CGLIB이 상속 못 함.
4. **체크 예외**: `@Transactional`은 RuntimeException/Error만 롤백 기본. 체크 예외는 `rollbackFor = Exception.class` 명시.

이 4가지가 Spring 면접에서 트랜잭션이 "안 동작했던 경험"으로 자주 나옵니다.

---

## Q6. Advice의 종류와 차이는?

**A.** 5가지가 있습니다.

- **`@Before`**: 메서드 실행 전.
- **`@After`**: 항상 실행(성공/실패 무관).
- **`@AfterReturning`**: 정상 반환 후.
- **`@AfterThrowing`**: 예외 발생 시.
- **`@Around`**: 실행 자체를 감쌈. `ProceedingJoinPoint.proceed()`로 대상 호출. **가장 강력**.

`@Around`는 시간 측정, 결과 변환, 예외 변환, 조건부 실행 모두 가능해서 실무에서 가장 많이 씁니다.

---

## Q7. AOP를 어디에 활용하시나요?

**A.** 인프라 관심사가 핵심 영역입니다.

- **트랜잭션**: `@Transactional`.
- **인증/인가**: `@PreAuthorize`.
- **로깅/감사**: 메서드 진입/종료 자동 로깅.
- **성능 측정**: `@Around`로 실행 시간 기록.
- **재시도/회로 차단**: Resilience4j의 `@Retry`, `@CircuitBreaker`.
- **캐싱**: `@Cacheable`.

비즈니스 로직을 AOP에 넣으면 흐름 추적이 어려워지므로 **공통 인프라 관심사**에만 한정하는 게 좋습니다.

---

## Q8. Spring AOP와 AspectJ의 차이는?

**A.**

| | Spring AOP | AspectJ |
|---|---|---|
| 위빙 시점 | 런타임 | 컴파일/로드 타임 |
| 적용 범위 | Spring 빈의 메서드 | 모든 객체, 필드, 생성자 |
| 자기 호출 | ❌ | ✅ |
| 성능 | 프록시 호출 비용 | 약간 더 빠름 |
| 학습 곡선 | 낮음 | 높음 |

대부분 Spring AOP로 충분. **자기 호출 케이스나 객체 생성/필드 접근까지 가로채야** 하면 AspectJ.

---

## Q9. JDK Proxy와 CGLIB는 어떻게 선택되나요?

**A.** **인터페이스 유무**가 기준입니다.

- 인터페이스 있음 → JDK Proxy(원래 기본).
- 인터페이스 없음 → CGLIB.
- Spring Boot 2.x+ 부터 **CGLIB이 기본**으로 변경(인터페이스 있어도). `proxy-target-class=false`로 JDK Proxy로 돌릴 수 있음.

CGLIB은 final 클래스/메서드를 상속할 수 없어 프록시 실패할 수 있습니다.

---

## Q10. AOP 남용의 위험은?

**A.** 4가지입니다.

- **호출 흐름 추적 어려움**: 코드만 봐서는 부수효과가 안 보임.
- **디버깅 어려움**: 스택 트레이스에 프록시 클래스가 끼어듬.
- **성능 디버깅 어려움**: 어디서 시간이 잡아먹히는지 안 보임.
- **테스트 복잡**: 단위 테스트에서 AOP 효과를 그대로 재현하기 어려움.

핵심 인프라 관심사(트랜잭션, 인증, 로깅) 정도로 **사용 범위를 좁히는 것**이 안전합니다.
