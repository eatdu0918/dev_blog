---
published: true
type: 'qna'
level: 'mid'
title: "자주 쓰는 디자인 패턴(싱글톤/팩토리/옵저버/전략) 설명해 주세요"
date: '2026-04-27'
categories: ['CS', 'Design', 'OOP']
---

## 핵심 요약

면접에서 4~5개의 패턴이 거의 매번 등장합니다: **싱글톤, 팩토리, 옵저버, 전략, 데코레이터**. 패턴 이름을 외우는 게 아니라 **풀어주는 문제**를 설명할 수 있어야 합니다.

## 싱글톤(Singleton)

**한 클래스에 인스턴스가 단 하나만 존재**하도록.

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

또는 enum으로 더 안전:
```java
enum Config { INSTANCE; }
```

### 함정
- **테스트 어려움**: 전역 상태 → 테스트 격리 깨짐.
- **숨겨진 의존성**: 어디서든 호출 가능 → DI로 명시적 주입이 더 나음.
- 멀티스레드 + 직렬화 + 리플렉션으로 깨질 수 있음.

Spring 빈이 기본 싱글톤 → 패턴을 직접 구현할 일 거의 없음.

## 팩토리(Factory)

**객체 생성 책임을 별도 클래스/메서드로 분리**.

종류:
- **Simple Factory**: 메서드가 분기로 인스턴스 반환. 패턴이라기보다 관용구.
- **Factory Method**: 부모가 추상 메서드 선언, 자식이 구체 인스턴스 결정.
- **Abstract Factory**: 관련 객체군(family)을 함께 생성.

```java
interface PaymentFactory { Payment create(PaymentType t); }
```

언제: 생성 로직이 복잡하거나, 외부에서 구체 클래스를 몰라야 할 때(DIP).

## 옵저버(Observer)

**Subject의 상태 변경을 구독자들에게 자동 통지**.

```java
interface Observer { void update(Event e); }
class Subject {
    private List<Observer> observers = new ArrayList<>();
    void subscribe(Observer o) { observers.add(o); }
    void notify(Event e) { observers.forEach(o -> o.update(e)); }
}
```

활용:
- 이벤트 시스템(DOM, Spring `ApplicationEvent`).
- 반응형 프로그래밍(RxJS, Reactor).
- MVC의 모델→뷰 동기화.

## 전략(Strategy)

**같은 인터페이스의 여러 구현을 런타임에 교체**.

```java
interface Discount { int apply(int price); }
class VipDiscount implements Discount { ... }
class CouponDiscount implements Discount { ... }
class Order { Discount discount; /* setter로 교체 가능 */ }
```

if/else 분기 대신 객체로 분기를 표현 → OCP 준수.

## 데코레이터(Decorator)

**기존 객체에 기능을 동적으로 추가**.

```java
class LoggingNotifier implements Notifier {
    private final Notifier delegate;
    public void send(Msg m) { log(m); delegate.send(m); }
}
```

상속보다 유연. Java의 InputStream/Reader 계층이 대표 예.

## 어댑터(Adapter)

**서로 다른 인터페이스를 호환되게**. 레거시 클래스를 새 인터페이스에 맞출 때.

## 템플릿 메서드(Template Method)

**알고리즘 골격은 부모, 일부 단계만 자식이 구현**.

```java
abstract class Report {
    public final void generate() { collect(); format(); send(); }
    protected abstract void collect();
    protected abstract void format();
    protected abstract void send();
}
```

Spring `JdbcTemplate`, `RestTemplate`이 이 패턴.

## 프록시(Proxy)

**대상 객체에 대한 대리자**. 접근 제어, 지연 로딩, 캐싱, 로깅. Spring AOP가 프록시 기반.

## 빌더(Builder)

복잡한 객체 단계적 생성. 파라미터가 많거나 선택적일 때.

```java
User u = User.builder().name("kim").age(30).build();
```

Lombok `@Builder`로 자동 생성.

## 자주 헷갈리는 디테일

- 싱글톤은 패턴이지만 **남용 시 안티패턴**. DI가 보통 더 나은 답.
- 전략 vs 상태(State): 둘 다 비슷한 구조. 차이는 **객체가 자기 상태를 알고 전이하느냐**.
- 옵저버 vs Pub/Sub: 옵저버는 직접 결합, Pub/Sub은 브로커 경유 → 더 느슨한 결합.

## 모던 코드에서의 의미

- 함수형/람다로 **간단한 패턴은 함수 한 줄**로 표현 가능. Strategy는 함수 인자, Observer는 콜백 등록.
- DI 컨테이너가 Factory/Singleton의 많은 부분 대체.
- **패턴 이름을 코드에 그대로 박는 것**은 옛 스타일. 의도가 드러나는 명명이 우선.

## 면접 follow-up

- "전략과 if/else 차이?" → 객체로 캡슐화하면 새 전략 추가 시 기존 코드 수정 X(OCP).
- "Java에서 싱글톤을 안전하게?" → enum 또는 정적 inner 클래스(Bill Pugh).
- "옵저버를 구현해 본 경험?" → Spring `ApplicationEventPublisher`, EventBus, RxJava Subject.
