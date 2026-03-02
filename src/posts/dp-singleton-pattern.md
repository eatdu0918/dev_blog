---
title: "싱글톤(Singleton) 패턴의 원리와 타입스크립트로 구현하며 배운 점"
date: "2026-02-27"
description: "객체의 인스턴스를 단 하나만 생성하여 전역적으로 공유하는 싱글톤 설계 패턴의 원리를 정리하고, 타입스크립트로 구현해보며 얻은 깨달음을 기록합니다."
---

객체 지향 프로그래밍에 익숙해질 무렵, 프로젝트 규모가 커지다 보니 같은 역할을 하는 객체가 불필요하게 여러 번 생성되어 자원을 낭비하는 상황을 마주하게 되었습니다. 특히 데이터베이스 연결 객체나 공통 설정(Configuration) 관리 객체처럼 애플리케이션 전체에 걸쳐 동일한 상태를 유지해야 하는 요소에서 이러한 문제가 두드러졌습니다.

이를 해결하기 위해 인스턴스를 오직 하나만 생성하도록 보장하는 설계 방법론인 싱글톤(Singleton) 디자인 패턴을 학습하고 적용해보았습니다.

## 인스턴스는 하나만 있으면 충분하다

어떤 클래스의 인스턴스가 굳이 여러 개 존재할 필요가 없는 상황이라면 어떻게 처리해야 할지 고민해 보았습니다. 새로운 객체를 매번 `new` 키워드로 생성하는 것은 메모리 낭비일 뿐 아니라, 동일한 전역 설정 파일을 여러 번 파싱하게 되어 시스템 오버헤드를 발생시킬 수도 있었습니다. 

이러한 경우를 위해 싱글톤 패턴은 최초 한 번만 메모리를 할당하여 객체를 생성하고, 이후의 호출에서는 만들어져 있는 최초의 객체를 그대로 반환하도록 설계되었습니다.

<img src="/images/singleton_pattern_concept.png" alt="싱글톤 패턴 개념 다이어그램" style="max-width: 100%;" />
*단일 인스턴스에 여러 클라이언트가 접근하는 싱글톤 패턴의 개념*

## TypeScript로 구현하며 이해한 동작 원리

개념 자체는 단순해 보였지만, 막상 코드로 작성하려고 보니 '클라이언트 측에서 임의로 인스턴스를 생성하는 것'을 어떻게 원천 차단할지가 관건이었습니다. 이를 TypeScript로 구현하면서 접근 제어자(`private`)와 정적 변수/메서드(`static`)의 쓰임새를 확실히 체감할 수 있었습니다.

```typescript
// Singleton Pattern Implementation
class DatabaseConnection {
  // 생성된 유일한 인스턴스를 담아둘 정적 변수 (최초에는 null)
  private static instance: DatabaseConnection | null = null;
  private connectionString: string;

  // 생성자를 private으로 선언하여, 클래스 외부에서 new 키워드를 사용한 생성을 강제로 막음
  private constructor() {
    // 무거운 초기화 작업이 일어난다고 가정
    this.connectionString = `connected_at_${Date.now()}`;
  }

  // 외부에서 오직 이 정적 메서드를 통해서만 인스턴스를 얻어갈 수 있음
  public static getInstance(): DatabaseConnection {
    // 인스턴스가 아직 생성되지 않은 최초 호출 시에만 생성 (Lazy Loading 방식)
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    // 항상 동일한 인스턴스를 반환
    return DatabaseConnection.instance;
  }

  public getConnectionString(): string {
    return this.connectionString;
  }
}

// ❌ 컴파일 에러: 생성자가 private이므로 new 키워드로 생성할 수 없음.
// const conn1 = new DatabaseConnection(); 

// ✅ 올바른 접근 방식:
const dbA = DatabaseConnection.getInstance();
const dbB = DatabaseConnection.getInstance();

console.log(dbA === dbB); // true! 완전히 같은 객체를 참조하고 있습니다.
```

1. **private 생성자**: 외부에서 함부로 `new`를 통해 객체를 찍어내지 못하도록 방어벽을 칩니다. 
2. **static instance 변수**: 단 하나 생성된 자신을 담아두는 보관함 역할을 합니다.
3. **getInstance() 메서드**: 외부에서 객체를 요청할 수 있는 유일한 통로입니다. 호출될 때마다 새로운 것을 만드는 것이 아니라 저장된 `instance`를 돌려줍니다.

## 경험을 통한 회고와 한계점

이 방식을 도입하여 초기화 비용과 메모리 낭비를 줄이는 데 분명 큰 도움을 받았습니다. 어디서든 `getInstance()`를 호출하면 같은 상태를 공유하는 객체를 얻을 수 있으니 무척 편리하게 느껴졌습니다.

그러나 설계 패턴을 조금 더 깊이 조사해 보고, 실제 테스트 코드를 작성하면서 이 패턴이 만능은 아니라는 점도 알게 되었습니다. 싱글톤 패턴은 구조적으로 '전역 상태(Global State)'를 만들어 버리기 때문에 각 모듈 간의 결합도를 높여버리는 부작용이 존재했습니다. 만약 싱글톤 객체가 오작동을 하거나 상태가 꼬이면, 이를 의존하고 있는 애플리케이션 전체에 연쇄적인 영향을 미치게 되었습니다.

또한 단위 테스트 시, 이전에 진행된 테스트가 싱글톤 객체의 상태를 변경해 놓으면 다음 테스트가 그 상태의 영향을 받는 '테스트 간 간섭' 문제가 발생할 수 있다는 사실도 알게 되었습니다. 편의성에 가려진 양날의 검과 같은 느낌이었습니다.

결과적으로 싱글톤 패턴이 객체의 생명주기를 통제하고 자원을 아낄 수 있는 직관적인 방법이긴 하나, 의존성 주입(DI)이나 다른 모듈 설계 기법으로 이를 대체하거나 남용하지 않는 것이 더 건강한 설계로 이어질 수 있다는 중요한 교훈을 얻었습니다. 문제 해결 과정에서 한 가지 기술의 완벽함보다는 트레이드오프(Trade-off)를 이해하는 것이 더 큰 가치임을 다시금 실감하게 된 여정이었습니다.
