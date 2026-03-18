---
published: true
title: "Java와 JavaScript의 오버라이드(Override) 개념 충돌과 깨달음"
description: "정적 타입 언어인 Java에 익숙하던 상태에서 동적 타입 언어인 JavaScript의 오버라이드 동작 방식을 마주하며 겪은 혼란을 정리합니다."
date: "2026-02-22"
tags: ["Programming", "Java", "JavaScript"]
---

# Java와 JavaScript의 오버라이드(Override) 개념 충돌과 깨달음

백엔드 개발의 기반 언어로 Java만을 사용하며 객체 지향 프로그래밍(OOP)을 학습해 왔던 나는, 다형성의 핵심인 **오버라이드(Override)** 개념이 모든 프로그래밍 언어에서 동일하고 엄격한 잣대로 적용될 것이라 굳게 믿고 있었다.

하지만 풀스택 개발을 위해 JavaScript(혹은 TypeScript) 진영론의 클래스 설계 파트를 건드리면서, 내가 알던 오버라이드와 오버로딩 규칙이 무참히 깨져버리며 겪었던 개념 파편화의 혼란과, 언어적 설계 철학의 차이를 이해하게 된 과정을 회고한다.

---

## 1. 내 머릿속의 굳건한 Java식 오버라이드 룰

Java는 정적 타입(Static Type) 컴파일 언어로서 부모-자식 객체 간의 재정의 규칙에 강박에 가까운 엄격한 문법 허들을 세워두고 있었다.

1. **메서드 시그니처 완벽 일치**: 자식이 부모의 무언가를 덮어쓰려 한다면 파라미터 갯수, 입력 타입, 반환 타입까지 모조리 판박이처럼 똑같아야만 컴파일러가 허락해주었다.
2. **`@Override` 애노테이션의 감시**: 스펠링을 하나라도 삐끗하면 오타로 인한 런타임 마비가 생길까 봐 애노테이션을 의무적으로 붙여 문법 에러를 방어해 냈다.
3. **오버로딩(Overloading)의 칼 같은 구별**: 이름이 같더라도, 넘겨받는 인자의 타입이 다르다면 아예 별개의 완전히 독립된 새로운 메서드로 취급하는 별개 공간 로직이 보장되었다.

```java
class BaseHttpClient {
    public void get() { System.out.println("URL 주소: 멍멍"); }
    public void get(int volume) { System.out.println("볼륨 " + volume); } // 오버로딩 허용
}

class CustomHttpClient extends BaseHttpClient {
    @Override
    public void get(String url) { System.out.println("[LOG] Custom 요청 실행: " + url); } // 정상 오버라이딩
    
    // @Override public void get(String type) -> 바로 빨간 줄 에러 폭격
}
```

---

## 2. JavaScript 프로토타입 환경에서의 혼란 도래

프론트엔드 컴포넌트나 노드 계층의 로직을 상속받아 짜던 도중, Java 방식대로 동일한 이름에 매개변수만 달라진 구조(오버로딩)를 만들고 실행해 보았다. 그러나 코드는 내가 예상한 기존 로직이 아닌 완전히 엉뚱한 로직을 삼켜버리고 있었다.

JavaScript는 프로토타입 기반의 동적 언어이므로, **"메서드의 이름 텍스트"** 단 하나만 부모 객체 정보(Prototype 체인)에 걸쳐 존재하고 존재 여부만 따질 뿐, 매개변수 타입이나 개수는 완전히 무시해 버리는 무법지대였다.

1. **이름만 같으면 무조건 덮어쓴다**: 인자가 없든, 수십 개를 넣든 부모와 이름이 동일한 함수를 런타임에 뱉는 순간, 프로토타입 체인상의 부모 원형 함수는 그 즉시 은폐(Shadowing)되어 증발 취급당했다. 오버로딩 생태계 자체가 전무했다.
2. **타입 검증 프리패스**: 동적 언어인지라 함수를 호출할 때 인자를 안 넘기면 `undefined`로 냅다 욱여넣고 실행해 버릴 뿐, 컴파일 에디터 단에서 오버라이드가 깨졌다고 친절하게 빨간 줄 에러를 가르쳐주지 않았다.

```javascript
class BaseHttpClient {
  get(volume) { console.log(`볼륨 ${volume || 5} 호출.`); }
}

class CustomHttpClient extends BaseHttpClient {
  // 인자 갯수가 다르든 말든 냅다 덮어쓰고 오버라이드 파괴 선언
  get(volume, isAngry) {
    if (isAngry) console.log("애옹 데이터 반환");
    else super.get(volume);
  }
}

// Java개발자 시점에선 경악스러운 자유도 허용
const myCustomHttpClient = new CustomHttpClient();
myCustomHttpClient.get(10, true);  
myCustomHttpClient.get(); // 컴파일 패스, 런타임에 undefined 넣고 굴러감
```

---

## 💡 최종 회고 정리

언어의 문법을 외우는 것에 그치지 않고, 그 언어가 **정적 컴파일을 지향하느냐(명확성/안정성)**, **동적 런타임 모델을 지향하느냐(유연성/생산성)**에 대한 근본 베이스 설계 철학 구조를 아키타입적으로 이해해야 코딩 컨벤션 파괴 버그를 피할 수 있다는 값진 지식을 거뒀다.

메서드의 "이름표" 하나만 보고 앞뒤 안 가리고 무자비하게 메모리를 덮어씌워 버리는 JavaScript의 유연한 광기를 맛보면서, 프론트엔드 대규모 객체 생태계에서 왜 그렇게 프레임워크 층계가 타입스크립트(TypeScript) 기반으로 피난처를 옮겨가며 정적 제어 강제를 스스로 요구하게 되는지, 그 뼈아픈 배경 역사까지도 명료하게 직관으로 흡수할 수 있었다.
