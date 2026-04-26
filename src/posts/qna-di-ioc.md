---
published: true
type: 'qna'
level: 'junior'
title: "DI(의존성 주입)와 IoC(제어의 역전)는 무엇이고 왜 쓰나요?"
date: '2026-04-27'
categories: ['Backend', 'Spring', 'Design']
---

## 핵심 요약

- **IoC(Inversion of Control)**: 제어 흐름을 **프레임워크가** 가져가고, 우리는 **코드가 호출되는 위치에서 동작 정의**만. "Don't call us, we'll call you."
- **DI(Dependency Injection)**: IoC를 **의존성 관리에 적용**한 구현 패턴. 객체가 필요로 하는 것을 직접 만들지 않고 **외부에서 받음**.

DI는 IoC의 한 종류일 뿐, 같은 말이 아닙니다.

## 왜 필요한가

```java
// Before — 강결합
class OrderService {
    private final EmailNotifier notifier = new EmailNotifier();
}

// After — DI
class OrderService {
    private final Notifier notifier;
    OrderService(Notifier notifier) { this.notifier = notifier; }
}
```

장점:
1. **테스트 용이**: 가짜 Notifier 주입 가능.
2. **교체 용이**: SMS Notifier로 바꿀 때 OrderService 수정 X.
3. **단일 책임**: OrderService는 Notifier 생성/생명주기를 신경 쓸 필요 없음.

## DI의 3가지 방식

### 생성자 주입 (권장)
```java
@Service
class OrderService {
    private final Notifier notifier;
    OrderService(Notifier notifier) { this.notifier = notifier; }
}
```
- **불변성** + **필수 의존성 명시** + **순환 참조 컴파일 시 발견**.

### 세터 주입
```java
@Autowired void setNotifier(Notifier n) { ... }
```
- 선택적 의존성에 적합. 객체가 일시적으로 의존성 없는 상태가 될 수 있음.

### 필드 주입 (지양)
```java
@Autowired Notifier notifier;
```
- 짧지만 **테스트 어려움 + 불변성 X + 의존성 숨김**. Spring 공식도 비권장.

## Spring의 IoC 컨테이너

- `@Component`, `@Service` 등으로 등록된 빈을 컨테이너가 생성/관리.
- 의존성을 그래프로 분석해 자동 주입.
- 생명주기(초기화, 소멸) 콜백 호출.
- 싱글톤이 기본 — 멀티스레드 환경에서 **상태 공유 금지**.

## 빈 충돌과 해결

같은 타입 빈이 여러 개일 때:
- `@Primary`: 기본값 지정.
- `@Qualifier("name")`: 명시적 선택.
- 생성자 파라미터 이름 = 빈 이름 매칭.

## DI ≠ DIP ≠ IoC 컨테이너

- **DIP**: 추상에 의존하라는 SOLID 원칙.
- **DI**: 의존성을 외부에서 주입하는 기법.
- **IoC 컨테이너**: DI를 자동으로 처리하는 프레임워크.

DI를 손으로 해도 DIP는 지킬 수 있고, 컨테이너 없이도 DI는 가능합니다.

## 자주 헷갈리는 디테일

- 생성자 주입에서 `@Autowired`는 단일 생성자면 생략 가능(Spring 4.3+).
- **순환 의존**은 설계 결함 신호. setter 주입으로 회피하지 말고 책임 재분리.
- 프로토타입 빈을 싱글톤에 주입하면 한 번만 주입돼 의도 깨짐 → `ObjectProvider`, `@Lookup` 사용.

## 면접 follow-up

- "왜 생성자 주입이 권장?" → 불변성, 필수 명시, 테스트 용이, 순환 참조 조기 발견.
- "DI 컨테이너 없이 DI 가능?" → 가능. 메인에서 객체 그래프를 손으로 wiring(Pure DI). 작은 앱은 충분.
- "Spring 빈은 왜 기본 싱글톤?" → 메모리/생성 비용 절감. 다만 상태를 가지면 동시성 이슈 → 보통 stateless service로 설계.
