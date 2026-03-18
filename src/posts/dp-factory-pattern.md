---
title: "팩토리 메서드(Factory Method) 패턴: 객체 생성의 책임을 분리하며 배운 설계의 유연성"
date: "2026-02-27"
description: "객체를 생성하는 로직을 하위 클래스로 위임하는 팩토리 메서드 설계 패턴의 원리를 요약하고, 타입스크립트로 구현해보며 얻은 설계적인 인사이트를 정리합니다."
---

애플리케이션에 새로운 기능을 덧붙일 때, 코드가 지나치게 복잡해지는 원인 중 하나는 '객체를 직접 생성하는 행위(`new` 키워드)'가 모든 곳에 흩어져 있기 때문이라는 것을 알게 되었습니다. 여러 종류의 객체를 상황에 맞게 꺼내 써야 하는 상황에서 코드 여기저기에 분기문(`if-else`, `switch`)을 두면, 새로운 객체 종류가 추가될 때마다 코드를 열어보고 수정해야 하는 번거로움에 봉착했습니다.

이러한 문제를 해결하기 위해 고안된 구조적 해결책이 '팩토리(Factory)'라는 객체 생성 전담 클래스를 도입하는 팩토리 메서드(Factory Method) 패턴이었습니다. 

## 객체의 구체적인 클래스를 팩토리에게 숨기다

어떤 인터페이스에 맞춰서 동작하는 객체가 필요한 것이지, 굳이 그 객체가 어떤 클래스로 만들어져야 하는지를 클라이언트가 알 필요는 없다는 점에 초점을 맞췄습니다. 클라이언트는 단지 "구글(Google) 로그인을 처리해 주는 객체를 만들어줘", 혹은 "카카오(Kakao) 로그인을 처리해 주는 객체를 줘"라고 요청하기만 하면 될 뿐이었습니다.

<img src="/images/factory_pattern_concept.png" alt="팩토리 패턴 개념 다이어그램" style="max-width: 100%;" />
*팩토리 내부에서 적절한 하위 클래스의 인스턴스를 생성해 주는 개념도*

이 설계 사상을 타입스크립트로 예제를 만들어보며 구현해보았습니다. 

## TypeScript로 팩토리 패턴 구현해보기

다양한 소셜 로그인을 제공하는 인증 시스템이 있다고 가정했습니다. 새로운 인증 수단이 추가되더라도 클라이언트 핵심 로직은 변경되지 않도록 인증 객체 생성의 책임을 팩토리 클래스에 위임했습니다. 

```typescript
// 공통 인터페이스
interface AuthService {
  authenticate(): string;
  getProviderName(): string;
}

// 구체적인 클래스 구현
class GoogleAuth implements AuthService {
  authenticate() { return 'Google 계정으로 인증 완료'; }
  getProviderName() { return 'google'; }
}

class KakaoAuth implements AuthService {
  authenticate() { return 'Kakao 계정으로 인증 완료'; }
  getProviderName() { return 'kakao'; }
}

// 인증(Auth) 객체를 생성하는 팩토리 클래스 정의
class AuthFactory {
  // 어떤 클래스의 인스턴스를 만들지 구체적으로 알 필요 없이 조건만 받아 생성
  static createAuthService(provider: 'google' | 'kakao'): AuthService {
    switch (provider) {
      case 'google':
        return new GoogleAuth();
      case 'kakao':
        return new KakaoAuth();
      default:
        throw new Error('지원하지 않는 인증 수단입니다.');
    }
  }
}

// 클라이언트 코드
// AuthFactory에게 필요한 것을 주문하듯이 요청합니다.
const googleService = AuthFactory.createAuthService('google');
const kakaoService = AuthFactory.createAuthService('kakao');

console.log(googleService.authenticate(), googleService.getProviderName()); // Google 인증 완료, google
console.log(kakaoService.authenticate(), kakaoService.getProviderName()); // Kakao 인증 완료, kakao
```

클라이언트가 직접 `new GoogleAuth()`이나 `new KakaoAuth()`를 호출하는 코드의 양을 확연히 줄일 수 있었습니다. 만약 `Naver`라는 새로운 인증 수단이 추가된다면, 클라이언트 코드는 손대지 않고 오직 `AuthFactory` 클래스의 `switch`문에 `case 'naver'`만 추가해 주면 기능이 자연스럽게 확장되는 구조를 만들 수 있었습니다.

## 확장성 확보를 통해 느낀 점

객체를 생성하는 책임을 분리하고 나니, 복잡했던 의존성 구조가 단방향으로 깔끔하게 교통정리되는 효과를 경험했습니다. 생성 로직과 비즈니스 로직의 결합이 느슨해진 덕분이었습니다.

기능을 추가해야 할 때마다 기존 동작 중인 코드를 파고들어가 수정하는 것은 예상치 못한 버그를 유발하는 경우가 잦았습니다. 하지만 팩토리 패턴을 적용해 보니 기존의 핵심 코드는 최대한 보존하면서 새로운 클래스만 부품 끼워넣듯 추가할 수 있는 열린 구조, 이른바 '개방-폐쇄 원칙 (Open-Closed Principle, OCP)'의 장점을 몸소 체감할 수 있었습니다. 

디자인 패턴이란 그저 외워야 할 규칙이 아니라, 코드가 엉키고 변경이 잦아졌을 때 어떻게 하면 유지보수성을 극대화할지 선배 개발자들이 남겨둔 유용한 아이디어의 집합이라는 사실을 크게 깨달은 유익한 과정이었습니다.
