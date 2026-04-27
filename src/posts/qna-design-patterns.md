---
published: true
type: 'qna'
level: 'mid'
title: "자주 쓰는 디자인 패턴(싱글톤/팩토리/옵저버/전략) 설명해 주세요"
date: '2026-04-27'
categories: ['CS', 'Design', 'OOP']
---

## Q1. 싱글톤은 무엇이고, 어떤 함정이 있나요?

**A.** **한 클래스에 인스턴스가 단 하나만 존재**하도록 보장하는 패턴입니다.

```java
class Config {
    private static volatile Config instance;
    private Config() {}
    public static Config getInstance() {
        if (instance == null) {
            synchronized (Config.class) {
                if (instance == null) instance = new Config();
            }
        }
        return instance;
    }
}
```

함정:
- **테스트 격리 깨짐**: 전역 상태라 테스트 간 영향.
- **숨겨진 의존성**: 어디서나 호출 가능 → DI로 명시 주입이 보통 더 낫습니다.
- 멀티스레드/직렬화/리플렉션으로 깨질 수 있음.

가장 안전한 구현은 enum:
```java
enum Config { INSTANCE; }
```

Spring 빈이 기본 싱글톤이라 실무에서는 직접 구현할 일이 드뭅니다.

---

## Q2. 팩토리 패턴은 언제 쓰나요?

**A.** **객체 생성 책임을 분리**해서 클라이언트가 구체 클래스를 모르게 할 때입니다.

종류:
- **Simple Factory**: 메서드가 분기로 인스턴스 반환. 관용구.
- **Factory Method**: 부모가 추상 메서드 선언, 자식이 구체 결정.
- **Abstract Factory**: 관련 객체군을 함께 생성.

```java
interface PaymentFactory { Payment create(PaymentType t); }
```

생성 로직이 복잡하거나, DIP를 지키기 위해 인터페이스만 노출하고 싶을 때 가치가 있습니다.

---

## Q3. 옵저버 패턴은 어디서 자주 쓰이나요?

**A.** **Subject의 상태 변경을 구독자들에게 자동 통지**하는 패턴입니다.

활용 사례:
- DOM 이벤트 리스너.
- Spring `ApplicationEventPublisher`.
- RxJS, Reactor 같은 반응형 프로그래밍.
- MVC의 모델 → 뷰 동기화.

```java
interface Observer { void update(Event e); }
```

옵저버와 Pub/Sub의 차이: 옵저버는 직접 결합(Subject가 Observer를 직접 부름), Pub/Sub은 브로커를 거쳐 더 느슨한 결합입니다.

---

## Q4. 전략 패턴과 if/else의 차이는요?

**A.** **분기를 객체로 표현**하는 게 핵심입니다.

```java
interface Discount { int apply(int price); }
class VipDiscount implements Discount { ... }
class CouponDiscount implements Discount { ... }
```

if/else는 새 분기 추가 시 기존 코드를 수정해야 하지만, 전략 패턴은 새 클래스만 추가하면 됩니다(OCP). 대신 클래스 수가 늘어나는 비용이 있습니다.

함수형 언어/람다가 있는 환경에서는 전략 = 함수 인자로 단순화되는 경우가 많습니다.

---

## Q5. 데코레이터와 프록시의 차이는요?

**A.** 둘 다 **대상 객체를 감싸는 구조**지만 의도가 다릅니다.

- **데코레이터**: 기능을 **추가**. `LoggingNotifier`가 원래 Notifier에 로깅 추가.
- **프록시**: **접근 제어**. 인증, 캐싱, 지연 로딩, 원격 호출.

Java의 `InputStream` 계층이 데코레이터 예시고, Spring AOP의 `@Transactional`이 프록시 예시입니다. 구조는 비슷하지만 어떤 책임을 추가하는지가 다릅니다.

---

## Q6. 템플릿 메서드는 언제 사용하나요?

**A.** **알고리즘 골격은 부모, 세부 단계만 자식이 구현**할 때.

```java
abstract class Report {
    public final void generate() { collect(); format(); send(); }
    protected abstract void collect();
    protected abstract void format();
    protected abstract void send();
}
```

Spring의 `JdbcTemplate`, `RestTemplate`이 대표 예시입니다. 단점은 상속 기반이라 결합이 강해진다는 점 — 합성으로 대체할 수 있는 경우가 많습니다.

---

## Q7. 빌더 패턴은 무엇이고 언제 효과적인가요?

**A.** 복잡한 객체를 단계적으로 생성. 파라미터가 많거나 선택적일 때 가독성이 큽니다.

```java
User u = User.builder().name("kim").age(30).email("k@a.com").build();
```

생성자 인자가 4개 이상이거나 선택 인자가 많으면 빌더가 거의 정답입니다. Lombok의 `@Builder`로 보일러플레이트가 사라집니다.

---

## Q8. 모던 코드에서 디자인 패턴의 의미는 어떻게 변했나요?

**A.** 많은 패턴이 언어 기능과 프레임워크로 흡수됐습니다.

- 함수형/람다로 Strategy, Observer, Command가 함수 한 줄.
- DI 컨테이너가 Factory, Singleton의 많은 부분 대체.
- 데코레이터는 AOP/미들웨어 체인으로.

이름을 코드에 그대로 박는 옛 스타일(`OrderFactoryStrategyImpl`)보다 **의도가 드러나는 명명**이 더 중요합니다. 패턴은 문제 해결의 도구지 목적이 아닙니다.
