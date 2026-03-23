---
published: true
title: "마이크로 프런트엔드(Micro Frontends)의 런타임 통합과 독립적 진화"
description: "모놀리스 프런트엔드의 한계를 넘어, 독립적인 팀이 각자의 속도로 개발하고 배포할 수 있는 마이크로 프런트엔드의 내부 구조와 런타임 통합 방식을 탐색합니다."
date: "2026-03-23"
tags: ["Architecture", "Frontend", "Micro Frontends"]
---

# 마이크로 프런트엔드(Micro Frontends)의 런타임 통합과 독립적 진화

![마이크로 프런트엔드 아키텍처 컨셉 도식](/public/images/mfe-architecture.png)

웹 애플리케이션의 규모가 커짐에 따라, 하나의 거대한 코드베이스(Monolith)를 관리하는 일은 점점 더 어려워진다는 것을 체감하곤 합니다. 여러 팀이 동시에 같은 파일을 수정하며 발생하는 충돌, 한 곳의 수정이 전체 빌드와 배포를 늦추는 현상은 개발 생산성을 저하시키는 큰 요인이 되기도 합니다.

이러한 문제를 해결하기 위해 백엔드에서 마이크로서비스 아키텍처(MSA)를 도입하듯, 프런트엔드에서도 애플리케이션을 작고 독립적인 단위로 나누어 관리하는 **마이크로 프런트엔드(Micro Frontends)** 개념을 학습해 보았습니다. 특히 런타임에서 각 마이크로 앱을 통합하는 방식인 **Module Federation**과 앱 간의 느슨한 결합을 유지하기 위한 통신 방식을 중점적으로 살펴보았습니다.

---

## 1. 마이크로 프런트엔드의 핵심 철학: 독립성과 자율성

마이크로 프런트엔드는 단순히 화면을 쪼개는 기술이 아니라, 팀 단위의 독립성을 보장하기 위한 전략이라는 점이 인상적이었습니다. 학습하며 정리한 핵심 원칙은 다음과 같습니다.

- **독립적 배포**: 특정 기능(예: 장바구니, 결제)을 담당하는 팀은 전체 애플리케이션을 다시 빌드하지 않고도 자신의 모듈만 배포할 수 있어야 합니다.
- **기술 스택의 자율성**: 각 팀은 필요에 따라 서로 다른 프레임워크나 라이브러리 버전을 선택할 수 있는 구조를 지향합니다. (물론 성능과 일관성을 위해 신중한 선택이 필요함을 배웠습니다.)
- **코드 격리**: 한 마이크로 앱의 오류가 전체 서비스의 중단으로 이어지지 않도록 런타임에서의 격리가 중요함을 알게 되었습니다.

---

## 2. 런타임 통합: Webpack Module Federation의 등장

과거에는 `iframe`이나 빌드 타임의 `npm package` 형태로 통합하곤 했지만, 최근에는 Webpack 5에서 도입된 **Module Federation**이 표준처럼 자리 잡고 있다는 사실을 확인했습니다.

이 방식은 'Container(Shell)' 역할을 하는 메인 앱이 런타임에 원격지(Remote)에 배포된 다른 앱의 자바스크립트 번들을 직접 불러와 실행하는 구조입니다. 이를 통해 공통 라이브러리(React, Vue 등)를 공유하면서도, 각 앱은 독립적인 엔드포인트를 가지는 유연한 통합이 가능하다는 지점이 매우 흥미로웠습니다.

---

## 3. 실전 예제: 마이크로 앱 간의 통신 (Event Bus)

각 마이크로 앱이 서로의 내부 상태를 직접 참조하게 되면 결합도가 높아져 마이크로 프런트엔드의 장점이 사라지게 됩니다. 대신, 중앙의 **이벤트 버스(Event Bus)**를 통해 메시지를 주고받는 방식을 구현해 보며 느슨한 결합을 유지하는 방법을 연습했습니다.

### MFE 간 독립적 통신을 위한 이벤트 버스(Event Bus) 구현

```typescript
/**
 * Micro Frontends 애플리케이션 간 통신을 위한 간단한 이벤트 버스 구현체입니다.
 */
type Callback = (data: any) => void;

class MicroFrontendEventBus {
  private events: { [key: string]: Callback[] } = {};

  subscribe(eventName: string, callback: Callback): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  publish(eventName: string, data: any): void {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  unsubscribe(eventName: string, callback: Callback): void {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter((cb) => cb !== callback);
    }
  }
}

export const eventBus = new MicroFrontendEventBus();
```

이 구조를 통해 마이크로 앱 A(상품 목록)에서 발생한 '장바구니 담기' 이벤트를 마이크로 앱 B(장바구니 헤더)가 수신하여 숫자를 업데이트하는 시나리오를 머릿속에 그려보았습니다. 서로의 존재를 알 필요 없이 오직 '이벤트 이름'과 '데이터 구조'라는 약속만으로 소통한다는 점이 객체지향의 메시지 전달 방식과 닮아 있다는 느낌을 받았습니다.

### 통신 인터페이스 검증을 위한 테스트 코드 작성

구현한 이벤트 버스가 의도대로 작동하는지 `Vitest`를 통해 검증해 보았습니다. 각 앱이 독립적으로 이벤트를 수신하고 해제하는 과정이 정상적으로 이루어짐을 확인했습니다.

```typescript
import { describe, it, expect, vi } from 'vitest';
import { eventBus } from '../src/examples/mfe-event-bus';

describe('MicroFrontendEventBus 통신 테스트', () => {
    it('이벤트를 발행하면 구독자가 데이터를 수신해야 함', () => {
        const callback = vi.fn();
        const testData = { id: 1, name: 'Micro App A' };

        eventBus.subscribe('APP_A_LOADED', callback);
        eventBus.publish('APP_A_LOADED', testData);

        expect(callback).toHaveBeenCalledWith(testData);
    });
});
```

---

## 💡 마치며: 학습을 통해 느낀 점과 과제

마이크로 프런트엔드를 학습하며 기술적인 복잡성보다 **'조직의 구조가 소프트웨어의 구조를 결정한다'**는 콘웨이의 법칙(Conway's Law)이 프런트엔드에도 깊게 투영되어 있다는 사실을 깨달았습니다.

단순히 소스 코드를 분리하는 것을 넘어, 공유 인터페이스의 설계와 버전 관리, 그리고 성능 최적화(공통 의존성 중복 로드 방지 등)는 여전히 해결해야 할 숙제로 남았습니다. 특히 런타임에 동적으로 모듈을 가져올 때 발생할 수 있는 네트워크 지연이나 에러 핸들링에 대해서도 추가적인 탐색이 필요함을 느꼈습니다.

다음 단계로는 실제 Module Federation 설정을 통해 서로 다른 포트에서 실행되는 두 앱이 런타임에 결합되는 과정을 프로젝트 단위로 직접 구축해 보려 합니다. 단순히 기술을 도입하는 것이 목적이 아니라, "우리의 팀 구성과 서비스 규모에 이 복잡성이 정당화되는가?"라는 질문을 끊임없이 던져야 한다는 교훈을 얻은 뜻깊은 학습이었습니다.
