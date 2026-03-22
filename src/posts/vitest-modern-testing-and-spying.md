---
published: true
title: "Vite 생태계의 모던 테스트 러너: Vitest의 개념과 도입기"
description: "Vite 기반의 고속 테스트 프레임워크인 Vitest를 처음 접하며 느낀 장점과 핵심 원리, 그리고 Mocking/Spying을 활용한 테스트 작성법을 학습자의 시선에서 정리합니다."
date: "2026-03-22"
tags: ["Testing"]
---

# Vite 생태계의 모던 테스트 러너: Vitest의 개념과 도입기

![Vitest의 핵심 개념과 이점](/public/images/vitest-concept-diagram.png)

최근 Vite가 프런트엔드 빌드 도구의 표준으로 자리 잡으면서, 테스트 환경 역시 그에 맞춰 변화하고 있음을 실감하게 되었습니다. 처음 테스트 코드를 작성해 보려 할 때 가장 먼저 마주친 도구가 바로 **Vitest(바이테스트)**였습니다. 

다른 도구들에 비해 설정이 간결하고 Vite와의 시너지가 뛰어나다는 점이, 테스트를 처음 시작하는 제게 큰 매력으로 다가왔습니다. Vitest를 탐구하며 배운 핵심 내용을 정리해 봅니다.

---

## 1. Vitest는 왜 등장했을까?

그동안 JavaScript 생태계에서 테스트 코드 작성이 진입장벽이 높게 느껴졌던 이유는 복잡한 설정 때문이었습니다. 특히 최신 ESM(ES Modules) 환경에서 테스트를 시작하려면 거쳐야 할 단계가 많았습니다.

Vitest는 이러한 문제를 **'Vite와 동일한 변환 파이프라인(Transformation Pipeline)'**을 사용함으로써 해결했습니다. "개발 환경과 테스트 환경이 분리되지 않고 하나로 연결되어 있다"는 점이 주는 명확함은 초보 개발자에게 큰 신뢰를 주었습니다.

---

## 2. Vitest가 선사하는 핵심 강점

학습하며 특히 인상 깊었던 몇 가지 기능들을 꼽아보았습니다.

- **극단적인 속도와 효율**: ESM 기반의 모듈 그래프를 활용하고, 파일 변경 시 필요한 테스트만 즉시 다시 실행하는 HMR(Hot Module Replacement) 기능은 테스트 개발 경험을 완전히 바꾸어 놓았습니다.
- **직관적인 API**: `describe`, `it`, `expect`와 같은 API는 영어 문장처럼 읽혀서, 테스트 코드를 처음 작성하는 입장에서도 의도를 파악하기가 매우 쉬웠습니다.
- **통합된 도구들**: Coverage 확인이나 UI 모드(웹 기반 대시보드) 등이 내장되어 있어 별도의 복잡한 설치 과정 없이도 풍부한 테스트 환경을 누릴 수 있음을 보게 되었습니다.

---

## 3. 실전 예제: Spying과 Mocking

지도로만 보던 Vitest를 실제 코드로 옮겨보며 성능을 확인했습니다. 외부 의존성인 `Mailer`를 가로채서(Spying) 정상적으로 동작하는지 검증하는 시나리오입니다.

```typescript
// src/examples/notification-service.ts
export class Mailer {
    send(email: string, message: string): boolean {
        // 실제 이메일 발송 로직 (생략)
        return true;
    }
}

export class NotificationService {
    constructor(private mailer: Mailer) {}

    notifyUser(userId: string, email: string, message: string): string {
        const success = this.mailer.send(email, message);
        return success ? `Notification sent to ${userId}` : "Failed";
    }
}
```

이제 위 코드를 Vitest의 `vi` API를 활용해 테스트해 봅니다.

```typescript
// test/notification-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Mailer, NotificationService } from '../src/examples/notification-service';

describe('NotificationService (Vitest vi-api)', () => {
    it('vi.spyOn()을 사용하여 Mailer가 정상적으로 호출되었는지 확인한다', () => {
        const mailer = new Mailer();
        const service = new NotificationService(mailer);

        // mailer.send() 메서드를 감시 리스트에 올린다.
        const sendSpy = vi.spyOn(mailer, 'send');

        service.notifyUser('user-123', 'test@example.com', 'Hello!');

        // 행위 검증: 실제로 1번 불렸는가? 특정 인자를 받았는가?
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledWith('test@example.com', 'Hello!');

        sendSpy.mockRestore(); // 다른 테스트에 영향을 주지 않도록 복원
    });
});
```

`vi.spyOn`이나 `vi.fn`과 같은 유틸리티들이 Vite의 ESM 환경에서 지체 없이 즉각 동작하는 것을 보며, 왜 'Vite-Native'라는 수식어가 붙었는지 이해할 수 있었습니다.

---

## 💡 마치며: 테스트가 '부담'이 아니게 되는 경험

Vitest를 도입하며 가장 크게 느낀 점은 **"테스트 실행 기다리는 시간이 아깝지 않다"**는 사실이었습니다. 

처음엔 그저 "Vite랑 친하니까" 정도로만 생각했지만, 내부적으로 어떻게 모듈을 처리하고 실행 속도를 끌어올리는지 학습하다 보니 이 도구가 현대 프런트엔드 생태계에서 왜 필수적인지 실감하게 되었습니다.

이제는 복잡한 UI 컴포넌트나 비즈니스 로직을 다룰 때도, 막강한 속도의 Vitest를 믿고 더 적극적으로 테스트 코드를 작성해 보려 합니다. 엔진의 속도만큼 우리의 개발 안정성도 비례해서 올라가는 것을 즐겁게 지켜보는 중입니다.