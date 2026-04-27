---
published: true
type: 'qna'
level: 'junior'
title: "DI(의존성 주입)와 IoC(제어의 역전)는 무엇이고 왜 쓰나요?"
date: '2026-04-27'
categories: ['Backend', 'Spring', 'Design']
---

## Q1. IoC와 DI는 같은 말인가요?

**A.** 아닙니다. **IoC가 더 큰 개념**이고 DI는 그 한 종류입니다.

- **IoC(Inversion of Control)**: 제어 흐름을 프레임워크가 가져감. "Don't call us, we'll call you." 콜백, 이벤트 기반, 템플릿 메서드도 모두 IoC.
- **DI(Dependency Injection)**: IoC를 **의존성 관리에 적용**한 구현 패턴. 필요한 객체를 직접 만들지 않고 외부에서 받음.

---

## Q2. DI를 쓰면 무엇이 좋아지나요?

**A.** 같은 코드를 두 가지 방식으로 비교해 보면 분명합니다.

```java
// 강결합
class OrderService {
    private final Notifier notifier = new EmailNotifier();
}

// DI
class OrderService {
    private final Notifier notifier;
    OrderService(Notifier notifier) { this.notifier = notifier; }
}
```

세 가지 이득:
1. **테스트 용이**: 가짜 Notifier 주입 가능.
2. **교체 용이**: SMS Notifier로 바꿔도 OrderService 수정 안 함.
3. **단일 책임**: OrderService는 Notifier의 생성/생명주기를 신경 쓸 필요 없음.

---

## Q3. DI의 3가지 방식 중 무엇을 쓰시나요?

**A.** **생성자 주입**이 권장입니다.

- **생성자 주입**: 불변성 + 필수 의존성 명시 + 순환 참조 조기 발견.
- **세터 주입**: 선택적 의존성용. 객체가 일시적으로 의존성 없는 상태가 될 수 있음.
- **필드 주입**(`@Autowired` 필드): 짧지만 테스트 어려움 + 불변성 X + 의존성 숨김. Spring 공식도 비권장.

```java
@Service
class OrderService {
    private final Notifier notifier;
    OrderService(Notifier notifier) { this.notifier = notifier; } // 권장
}
```

---

## Q4. 같은 타입의 빈이 여러 개면 어떻게 해결하나요?

**A.** 3가지 방법이 있습니다.

- **`@Primary`**: 기본값 지정.
- **`@Qualifier("name")`**: 명시적 선택.
- **파라미터 이름 매칭**: 빈 이름과 같으면 자동 매칭.

```java
@Service @Primary class EmailNotifier implements Notifier { ... }
@Service @Qualifier("sms") class SmsNotifier implements Notifier { ... }

OrderService(@Qualifier("sms") Notifier notifier) { ... }
```

---

## Q5. 순환 의존이 발생하면 어떻게 해결해야 하나요?

**A.** **setter 주입으로 회피하지 마세요**. 순환 의존은 거의 항상 **설계 결함 신호**입니다.

해결:
- 두 클래스의 책임을 다시 분석. 공통 기능을 제3의 클래스로 추출.
- 이벤트 기반으로 분리(직접 호출 대신 이벤트 발행).
- 그래도 어려우면 setter 주입 + `@Lazy`로 일시 회피하지만 어디까지나 임시방편.

생성자 주입은 순환 의존을 컴파일 시점에 발견시켜주는 점이 오히려 장점입니다.

---

## Q6. DI / DIP / IoC 컨테이너는 어떻게 다른가요?

**A.** 자주 혼동되지만 다른 층위입니다.

- **DIP(Dependency Inversion Principle)**: 추상에 의존하라는 SOLID 원칙.
- **DI(Dependency Injection)**: 의존성을 외부에서 주입하는 기법.
- **IoC 컨테이너**: DI를 자동으로 처리하는 프레임워크(Spring, Guice).

DI를 손으로 해도 DIP는 지킬 수 있고, 컨테이너 없이도 DI는 가능합니다(Pure DI). 작은 앱은 메인 함수에서 그래프를 직접 wiring하는 게 더 단순합니다.

---

## Q7. Spring 빈이 기본 싱글톤인 이유와 주의점은?

**A.** **메모리와 생성 비용 절감**이 이유입니다. 대부분 service는 stateless라 공유해도 무해합니다.

주의점:
- **상태(필드)를 가지면 동시성 이슈** 발생. 인스턴스 변수에 사용자 데이터 담지 말 것.
- 상태가 필요하면 `ThreadLocal`, 메서드 파라미터, 또는 prototype scope.
- ConcurrentHashMap 같은 thread-safe 자료구조면 공유 OK.

---

## Q8. 프로토타입 빈을 싱글톤에 주입하면 어떻게 되나요?

**A.** **한 번만 주입되어 의도가 깨집니다**. 싱글톤 빈은 한 번만 생성되므로 자기에게 주입된 prototype 빈도 한 번만 받습니다.

해결:
- **`ObjectProvider<T>`** 또는 `Provider<T>`: 호출 시점에 새 인스턴스.
- **`@Lookup`** 메서드: 메서드 호출마다 새 빈.
- `ApplicationContext.getBean()`: 명시적이지만 컨테이너 결합 증가.

```java
@Service
class A {
    private final ObjectProvider<B> bProvider;
    A(ObjectProvider<B> bProvider) { this.bProvider = bProvider; }
    void use() { B b = bProvider.getObject(); /* 매번 새 인스턴스 */ }
}
```
