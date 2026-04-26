---
published: true
type: 'qna'
level: 'mid'
title: "Spring AOP는 어떻게 동작하고 언제 쓰나요?"
date: '2026-04-27'
categories: ['Spring', 'Backend']
---

## 핵심 요약

- **AOP(Aspect-Oriented Programming)**: 횡단 관심사(cross-cutting concerns)를 비즈니스 코드에서 분리.
- 트랜잭션, 로깅, 인증, 캐싱 같은 **여러 곳에 반복되는 로직**을 한 곳에 모음.
- Spring AOP는 **프록시 기반**(런타임 생성). AspectJ는 컴파일/로드 타임 위빙으로 더 강력.

## 핵심 용어

- **Aspect**: 횡단 관심사 묶음.
- **Join Point**: 적용 가능한 지점(Spring AOP는 메서드 호출).
- **Pointcut**: Join Point 중 어디에 적용할지 표현식.
- **Advice**: 실제 실행될 코드(`@Before`, `@After`, `@Around` 등).
- **Weaving**: Aspect를 대상에 적용하는 과정.

## 프록시 방식

Spring AOP가 사용하는 두 가지:

- **JDK Dynamic Proxy**: 인터페이스 기반. 인터페이스 구현체에 적용.
- **CGLIB**: 클래스 상속 기반. 인터페이스 없을 때. Spring Boot 2.x+ 기본.

런타임에 빈을 감싸는 프록시 객체를 생성 → 클라이언트는 프록시를 호출 → Advice 실행 후 실제 메서드 호출.

## 자기 호출 함정 (Self-Invocation)

```java
@Service
class A {
    public void outer() {
        this.inner(); // ❌ AOP 안 탐
    }
    @Transactional
    public void inner() { ... }
}
```

`this.inner()`는 프록시를 거치지 않으므로 `@Transactional`/`@Cacheable` 등이 **무시됨**. 가장 자주 나오는 면접 질문이자 실무 함정.

해결:
- 다른 빈으로 분리해 호출.
- 자기 자신을 빈으로 주입(`ApplicationContext.getBean(A.class)`).
- AspectJ 위빙 사용(런타임 프록시 우회).

## `@Transactional`도 AOP다

- Spring 트랜잭션은 AOP로 구현.
- `private` 메서드, `final` 메서드, 자기 호출에서 안 먹는 이유가 모두 프록시 한계 때문.
- `final` 클래스는 CGLIB이 상속 못 해서 프록시 실패.

## Advice 종류

- `@Before`: 메서드 실행 전.
- `@After` / `@AfterReturning` / `@AfterThrowing`: 후처리.
- `@Around`: 실행 자체를 감쌈. `ProceedingJoinPoint.proceed()`로 대상 호출. **가장 강력**(시간 측정, 결과 변환, 예외 변환).

## 활용 사례

- **트랜잭션 관리**: `@Transactional`.
- **인증/인가**: `@PreAuthorize`.
- **로깅/감사(Audit)**: 메서드 진입/종료 자동 로깅.
- **성능 측정**: `@Around`로 실행 시간 기록.
- **재시도/회로 차단**: Resilience4j의 `@Retry`, `@CircuitBreaker`.
- **캐싱**: `@Cacheable`.

## Spring AOP vs AspectJ

| | Spring AOP | AspectJ |
|---|---|---|
| 위빙 시점 | 런타임 | 컴파일/로드 타임 |
| 적용 범위 | Spring 빈의 메서드 | 모든 객체, 필드, 생성자 |
| 자기 호출 | ❌ | ✅ |
| 성능 | 프록시 호출 비용 | 약간 더 빠름 |
| 학습 곡선 | 낮음 | 높음 |

대부분 Spring AOP로 충분. 자기 호출 케이스나 객체 생성/필드 접근까지 가로채야 하면 AspectJ.

## 자주 헷갈리는 디테일

- 인터페이스 + 구현체 구조에서 **인터페이스에 어노테이션**을 붙여야 적용되는지 여부 — Spring은 둘 다 인식하지만 **구현체에** 붙이는 것이 일반적.
- `@Transactional`은 RuntimeException과 Error에서만 롤백이 기본. 체크 예외는 명시(`rollbackFor = Exception.class`).
- 프록시는 빈으로 등록될 때만 생성. `new`로 만든 객체에는 AOP 안 먹음.

## 면접 follow-up

- "JDK Proxy와 CGLIB의 선택?" → 인터페이스 유무. Spring Boot 2.x+는 CGLIB 기본이지만 인터페이스 있으면 JDK Proxy 사용 옵션.
- "@Transactional이 안 먹는 경험?" → self-invocation, private 메서드, 체크 예외, propagation 잘못, 같은 트랜잭션에 들어간 줄 모르는 경우.
- "AOP 남용의 위험?" → 디버깅 어려움, 호출 흐름 추적 어려움, 성능 디버깅 어려움. 핵심 인프라 관심사로 한정.
