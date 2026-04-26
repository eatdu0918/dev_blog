---
published: true
type: 'qna'
level: 'junior'
title: "객체지향의 4대 특징과 SOLID 원칙을 설명해 주세요"
date: '2026-04-27'
categories: ['CS', 'OOP', 'Design']
---

## 핵심 요약

신입/주니어 면접에서 가장 자주 나오는 질문 중 하나. 단어를 외우는 답이 아니라 **각 원칙이 풀어주는 문제**를 설명하면 깊이가 드러납니다.

## 객체지향 4대 특징

### 추상화 (Abstraction)
복잡한 시스템에서 본질만 드러내고 나머지를 숨김. 인터페이스 / 추상 클래스로 표현.

### 캡슐화 (Encapsulation)
상태(필드)를 객체 내부로 숨기고 동작(메서드)으로만 접근. **잘못된 상태로 가는 경로 차단**이 본질. getter/setter 남발은 캡슐화가 아님.

### 상속 (Inheritance)
공통 행동을 부모로 묶음. 단, **구현 상속은 결합을 강하게** 함 → 상속보다 **합성(composition)** 선호가 현대 권장.

### 다형성 (Polymorphism)
같은 메시지에 객체마다 다른 응답. 오버라이딩/인터페이스 구현이 핵심. **확장에 열려 있고 변경에 닫혀 있는** 설계의 토대.

## SOLID

### S — Single Responsibility Principle (SRP)
"클래스는 변경 이유가 하나여야 한다." **변경 이유 = 누가 요구하는가**. 결제 정책, 출력 포맷, DB 스키마는 각각 다른 이해관계자.

### O — Open/Closed Principle (OCP)
**확장에는 열려 있고 수정에는 닫혀 있다.** 새 결제 수단 추가 = 새 클래스 추가. 기존 클래스 if/else 추가 = 위반.

### L — Liskov Substitution Principle (LSP)
부모 타입을 받는 곳에 **자식 타입을 넣어도 동작이 바뀌면 안 됨**. `Square extends Rectangle` 안티패턴이 단골 예시(`setWidth`가 height까지 바꾸면 LSP 위반).

### I — Interface Segregation Principle (ISP)
**큰 인터페이스 하나보다 작은 인터페이스 여러 개**. 클라이언트가 안 쓰는 메서드에 의존하지 않게.

### D — Dependency Inversion Principle (DIP)
**고수준 모듈이 저수준 모듈에 의존하지 말고 추상에 의존**. Service가 `MySQLUserRepository`가 아니라 `UserRepository` 인터페이스에 의존.

## 자주 나오는 함정

- **상속 vs 합성**: "is-a"가 아니면 합성. 행동 변경 가능성이 있으면 합성.
- **getter/setter 남발 = 캡슐화 위반**: 상태를 그냥 노출.
- **DIP와 DI는 다름**: DIP는 원칙, DI(의존성 주입)는 구현 기법.
- **OCP는 절대 원칙이 아님**: 확장 포인트를 무한히 만들면 복잡도 폭발. 변경 가능성이 보일 때 적용.

## 설계 시 우선순위

면접에서 "SOLID를 모두 지키나요?"에 대한 좋은 답은 "**상황에 맞춰 트레이드오프**":
1. SRP/DIP는 거의 항상 효과 큼.
2. OCP는 변경 가능성이 명확할 때.
3. ISP는 인터페이스가 비대해질 때.
4. LSP는 상속을 쓸 때만 적용.

## 자주 헷갈리는 디테일

- "추상화 = 인터페이스" 단순화는 부정확. **구현 세부사항 숨김**이 본질.
- 캡슐화 = private 키워드가 아님. 무엇을 노출할지의 **설계 결정**.
- SOLID는 객체지향 한정 원칙. 함수형 패러다임에서는 다른 원칙(순수 함수, 불변성, 합성)이 작동.

## 면접 follow-up

- "SRP에서 책임을 어떻게 식별?" → "변경 이유 = 누가 변경 요구를 하는가"로 묻기.
- "상속을 안 쓰면 다형성 어떻게?" → 인터페이스 + 합성. 전략 패턴이 대표 예.
- "DIP를 위반한 코드 예?" → Service가 `new MySQLRepository()`를 직접 생성. 인터페이스 + DI 컨테이너로 분리.
