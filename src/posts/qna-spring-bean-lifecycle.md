---
published: true
type: 'qna'
level: 'mid'
title: "Spring 빈의 생명주기와 스코프를 설명해 주세요"
date: '2026-04-27'
categories: ['Spring', 'Backend']
---

## 핵심 요약

Spring 면접에서 단골. 빈이 **언제 생성되고, 언제 의존성이 주입되며, 언제 소멸하는지** 흐름을 짚을 수 있어야 합니다.

## 빈 생명주기 (싱글톤 기준)

1. **인스턴스 생성**: 컨테이너가 클래스 정보로 객체 생성.
2. **의존성 주입**: 생성자/세터/필드로 의존성 주입.
3. **`Aware` 콜백**: `BeanNameAware`, `ApplicationContextAware` 등.
4. **`BeanPostProcessor.postProcessBeforeInitialization`**.
5. **초기화**: `@PostConstruct` → `InitializingBean.afterPropertiesSet()` → `@Bean(initMethod)`.
6. **`BeanPostProcessor.postProcessAfterInitialization`**: 여기서 AOP 프록시가 감싸짐.
7. **사용**: 빈 사용.
8. **소멸**: `@PreDestroy` → `DisposableBean.destroy()` → `@Bean(destroyMethod)`.

`@PostConstruct`는 의존성이 모두 주입된 **후** 호출됨이 보장 → 초기화 검증/캐시 워밍에 사용.

## 빈 스코프

| 스코프 | 설명 |
|---|---|
| `singleton` (기본) | 컨테이너당 1개 인스턴스 |
| `prototype` | 요청마다 새 인스턴스 |
| `request` | HTTP 요청 1개당 (web) |
| `session` | HTTP 세션당 (web) |
| `application` | ServletContext당 (web) |
| `websocket` | 웹소켓 세션당 |

## 싱글톤이 기본인 이유

- 메모리/생성 비용 절약.
- 대부분 service는 stateless라 공유 무해.
- 함정: **상태(필드)를 가지면 동시성 이슈**. instance variable에 사용자 데이터 담지 말 것.

## 프로토타입 빈을 싱글톤에 주입할 때

```java
@Service
class A {
    @Autowired B prototypeBean; // ❌ 한 번만 주입됨
}
```

A는 싱글톤이라 B를 한 번만 주입받음 → 매번 새 B를 원했지만 같은 B 사용. 해결:

- `ObjectProvider<B>` 또는 `Provider<B>`: 호출 시점에 새 빈 가져옴.
- `@Lookup` 메서드: 메서드 호출 시 새 인스턴스.
- `ApplicationContext.getBean(B.class)`: 명시적이지만 컨테이너 결합.

## 빈 등록 방법

- `@Component` / `@Service` / `@Repository` / `@Controller` + 컴포넌트 스캔.
- `@Configuration` + `@Bean` 메서드: 외부 라이브러리 등록, 조건부 빈에 유리.
- `@Import`, `@ComponentScan` 범위 조정.
- `BeanDefinitionRegistry`로 동적 등록.

## 컨테이너 종류

- **`BeanFactory`**: 가장 기본. 지연 로딩.
- **`ApplicationContext`**: BeanFactory + 메시지/이벤트/AOP/리소스. 거의 항상 이걸 사용.
- **`WebApplicationContext`**: 웹 환경.

## 자주 헷갈리는 디테일

- `@PostConstruct`는 JSR-250(java.* 패키지). Java 11+에서는 의존성 추가 필요.
- `@Bean(initMethod=...)`은 외부 라이브러리 클래스를 빈으로 등록할 때.
- `BeanPostProcessor`로 프록시가 만들어지므로 **AOP는 초기화 콜백 이후에만** 적용.
- `@Scope("prototype")` 빈은 컨테이너가 소멸 콜백을 호출하지 않음(클라이언트가 책임).

## 면접 follow-up

- "@PostConstruct vs InitializingBean vs @Bean(initMethod) 우선순위?" → @PostConstruct → afterPropertiesSet → custom init.
- "싱글톤 빈에 상태 담을 수 있는 경우?" → ConcurrentHashMap 같은 thread-safe 자료구조나 atomic 변수만.
- "빈 등록 순서 제어?" → `@DependsOn`, `@Order`. 가능하면 순서에 의존하지 않도록 설계.
