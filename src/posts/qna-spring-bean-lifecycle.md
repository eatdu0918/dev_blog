---
published: true
type: 'qna'
level: 'mid'
title: "Spring 빈의 생명주기와 스코프를 설명해 주세요"
date: '2026-04-27'
categories: ['Spring', 'Backend']
---

## Q1. Spring 빈 생명주기 흐름을 설명해 주세요.

**A.** 8단계입니다.

1. **인스턴스 생성**: 컨테이너가 클래스 정보로 객체 생성.
2. **의존성 주입**: 생성자/세터/필드로 의존성 주입.
3. **Aware 콜백**: `BeanNameAware`, `ApplicationContextAware` 등.
4. **`BeanPostProcessor.postProcessBeforeInitialization`**.
5. **초기화**: `@PostConstruct` → `afterPropertiesSet()` → `@Bean(initMethod)`.
6. **`BeanPostProcessor.postProcessAfterInitialization`**: 여기서 **AOP 프록시가 감싸짐**.
7. **사용**.
8. **소멸**: `@PreDestroy` → `DisposableBean.destroy()` → `@Bean(destroyMethod)`.

---

## Q2. @PostConstruct는 언제 호출되나요?

**A.** **의존성이 모두 주입된 후, 빈이 사용 가능해지기 직전**입니다.

- 생성자에서 의존성에 접근하는 코드는 안전하지만, 다른 빈의 메서드를 호출하는 초기화 작업은 `@PostConstruct`로 미루는 게 안전.
- 캐시 워밍, 외부 리소스 검증, 스케줄러 등록에 자주 사용.

`@PostConstruct`는 JSR-250(java.* 패키지)이라 Java 11+에서는 별도 의존성 필요할 수 있습니다.

---

## Q3. 빈 스코프 종류와 차이는?

**A.**

| 스코프 | 설명 |
|---|---|
| `singleton` (기본) | 컨테이너당 1개 인스턴스 |
| `prototype` | 요청마다 새 인스턴스 |
| `request` | HTTP 요청 1개당 |
| `session` | HTTP 세션당 |
| `application` | ServletContext당 |
| `websocket` | 웹소켓 세션당 |

대부분 singleton, 사용자별 상태가 필요한 web에서만 request/session.

---

## Q4. 싱글톤이 기본인 이유는?

**A.** **메모리와 생성 비용 절약**입니다. 대부분 service는 stateless라 공유해도 무해합니다.

함정: **상태(필드)를 가지면 동시성 이슈** 발생.
- 인스턴스 변수에 사용자 데이터 담으면 안 됨.
- 상태가 필요하면 ThreadLocal, ConcurrentHashMap 같은 thread-safe 자료구조, 또는 `prototype` 스코프.

---

## Q5. 프로토타입 빈을 싱글톤에 주입하면 어떻게 되나요?

**A.** **한 번만 주입되어 의도가 깨집니다**.

```java
@Service
class A {
    @Autowired B prototypeBean;  // ❌ 한 번만 주입
}
```

A가 싱글톤이라 B도 한 번만 주입받음. 매번 새 B를 원했다면 의도 깨짐.

해결:
- **`ObjectProvider<B>`**: 호출 시점에 새 인스턴스.
- **`@Lookup`** 메서드: 메서드 호출마다 새.
- `ApplicationContext.getBean()`: 명시적이지만 컨테이너 결합.

---

## Q6. 빈 등록 방법에는 어떤 것들이 있나요?

**A.** 4가지가 있습니다.

- **`@Component` 계열** + 컴포넌트 스캔: 가장 흔함.
- **`@Configuration` + `@Bean`**: 외부 라이브러리 등록, 조건부 빈에 유리.
- **`@Import`** / `@ComponentScan` 범위 조정.
- **`BeanDefinitionRegistry`**: 동적 등록.

내가 만든 클래스는 `@Component`, 외부 라이브러리 클래스를 빈으로 만들 때는 `@Bean`이 일반적인 분리입니다.

---

## Q7. 초기화 콜백 3가지의 우선순위는?

**A.** **`@PostConstruct` → `InitializingBean.afterPropertiesSet()` → `@Bean(initMethod)`** 순.

세 개를 모두 쓰면 이 순서대로 호출되지만, 보통 하나만 사용합니다.

- 내가 만든 클래스: `@PostConstruct` 권장.
- 외부 라이브러리: `@Bean(initMethod = "init")`.
- `InitializingBean` 인터페이스 구현: Spring 결합이 강해 비권장.

---

## Q8. AOP 프록시는 빈 생명주기 어디에서 만들어지나요?

**A.** **`BeanPostProcessor.postProcessAfterInitialization`** 시점입니다.

즉 초기화 콜백(`@PostConstruct`)이 호출된 **후** 프록시로 감싸집니다. 그래서:

- `@PostConstruct` 안에서 `this.someTransactionalMethod()`를 호출하면 **AOP가 안 탑니다**(아직 프록시가 안 감쌌음).
- 초기화 콜백 안에서 트랜잭션 메서드를 호출하지 말 것.

이 디테일은 실무 함정으로 자주 등장합니다.

---

## Q9. 빈 등록 순서를 제어하려면?

**A.** **`@DependsOn`** 또는 **`@Order`** 를 사용합니다.

```java
@Component
@DependsOn("databaseInitializer")
class CacheWarmer { ... }
```

다만 가능하면 **순서에 의존하지 않도록 설계**하는 게 좋습니다. 의존성을 명시적으로 주입받으면 Spring이 그래프를 분석해서 순서를 자동으로 결정합니다.

순서 의존이 진짜 필요한 경우: DB 마이그레이션 → 캐시 워밍 → 스케줄러 시작 같은 외부 리소스 초기화 시퀀스.

---

## Q10. prototype 빈은 컨테이너가 소멸 콜백을 호출하나요?

**A.** **아니요, 호출하지 않습니다**.

- 싱글톤: 컨테이너 종료 시 `@PreDestroy` 호출.
- 프로토타입: **클라이언트가 직접 책임**. 컨테이너는 생성만 하고 이후 추적 안 함.

prototype 빈에 외부 리소스(파일/소켓)를 들고 있으면 누수 위험이 있어 명시적 close 패턴이 필요합니다.
