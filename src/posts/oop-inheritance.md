---
published: true
title: '상속(Inheritance): 코드 재사용을 넘어 구조적 계층 만들기'
date: '2026-03-05'
categories: ['Programming', 'CS', 'OOP']
---

# 상속(Inheritance): 코드 재사용을 넘어 구조적 계층 만들기

비슷한 기능을 가진 클래스들을 여러 개 만들다 보면, 공통된 로직을 매번 복사해서 붙여넣고 있는 자신을 발견하게 됩니다. 프로젝트 초기에는 문제가 없겠지만, 공통 로직에 버그가 발견되거나 수정이 필요해지면 모든 파일을 찾아다니며 수정해야 하는 관리의 늪에 빠지게 됩니다.

**상속(Inheritance)**은 이러한 중복을 제거하고, 객체들 사이의 계층 관계를 정의하여 코드를 체계적으로 관리할 수 있게 해주는 강력한 도구입니다.

![상속 시각화](/public/images/oop-inheritance.png)

## 부모의 유산을 물려받는 자식 클래스

상속을 사용하면 기존 클래스(부모 클래스)의 필드와 메서드를 그대로 물려받으면서, 필요한 기능만 추가하거나 수정(Overriding)하여 새로운 클래스(자식 클래스)를 만들 수 있습니다. 

단순히 타자를 덜 치기 위한 기술이 아니라, 'A는 B의 일종이다(Is-A 관계)'라는 논리적 구조를 설계하는 과정입니다.

```typescript
// 공통 기능을 가진 부모 클래스
class Logger {
  protected log(message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
}

// 부모의 기능을 물려받아 특화된 기능을 수행하는 자식 클래스
class FileLogger extends Logger {
  public saveLog(content: string) {
    // 부모의 log 메서드를 사용하여 공통 포맷 적용
    this.log(`File: ${content}`);
    // 파일 저장 로직...
  }
}
```

## 실전 예제: 서비스 알림 시스템의 계층화

모든 서비스 알림은 '전송'이라는 공통 행위와 '로깅'이라는 공통 절차를 가질 수 있습니다. 이를 부모 클래스에 정의해두면, 이메일이나 알림톡 등 구체적인 수단이 추가될 때마다 핵심 절차를 재구현할 필요가 없습니다.

```typescript
abstract class BaseNotification {
  protected abstract sendLogic(msg: string): void;

  // 모든 알림에 공통으로 적용될 템플릿 로직
  public send(message: string) {
    console.log("--- 알림 전송 시작 ---");
    this.sendLogic(message);
    console.log("--- 알림 전송 완료 ---");
  }
}

class EmailNotification extends BaseNotification {
  protected sendLogic(msg: string) {
    console.log(`📧 이메일 발송: ${msg}`);
  }
}

class SmsNotification extends BaseNotification {
  protected sendLogic(msg: string) {
    console.log(`💬 SMS 발송: ${msg}`);
  }
}
```

## 학습을 통해 깨달은 점

상속은 중복을 줄여주는 달콤한 도구이지만, 양날의 검과 같다는 점도 배웠습니다. 부모 클래스가 너무 많은 책임을 지거나 상속 계층이 너무 깊어지면, 부모 클래스의 작은 변경이 모든 자식 클래스에 예측 불가능한 영향을 주는 '깨지기 쉬운 클래스 문제'가 발생할 수 있습니다.

그래서 최근에는 무조건적인 상속보다는 **'조립(Composition)'**을 선호하는 추세도 있다는 것을 알게 되었습니다. 상속을 사용할 때는 항상 "이 관계가 논리적으로 정말 Is-A 관계인가?"를 자문하며 신중하게 설계해야 한다는 큰 교훈을 얻었습니다.
