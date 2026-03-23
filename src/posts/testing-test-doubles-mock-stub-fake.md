---
published: true
title: "테스트 더블 이해하기: Mock, Stub, Fake의 차이와 활용"
description: "단위 테스트를 작성할 때 외부 의존성을 효과적으로 격리하기 위한 테스트 더블의 종류를 파악하고, 각 상황에 맞는 활용법을 정리합니다."
date: "2026-03-22"
tags: ["Testing"]
---

# 테스트 더블 이해하기: Mock, Stub, Fake의 차이와 활용

![테스트 더블 타입 도식](/public/images/test-doubles.png)

테스트 코드를 작성하다 보면 외부 데이터베이스나 API 서버 등 우리의 통제권을 벗어난 요소들을 마주하게 됩니다. 테스트가 외부 변화에 흔들리지 않고 오직 우리의 로직에만 집중하게 하려면, 이들을 대신할 '가짜 객체'인 **테스트 더블(Test Double)**이 필요함을 알게 되었습니다. 

영화 촬영장의 대역 배우(Stunt Double)처럼, 우리 코드 속 대역들이 각자 어떤 역할을 수행하는지 학습한 내용을 정리해 보았습니다.

---

## 1. 테스트 목적에 따른 대역들의 종류

테스트 더블은 단순히 '가짜'를 넘어 각자의 쓰임새가 명확히 구분되어 있었습니다.

- **Stub (스텁)**: 테스트에서 요청한 질문에 대해 미리 준비된 답변만 던지는 고정된 객체입니다. "이 메서드가 불리면 무조건 이 값을 돌려줘"라고 설정할 때 주로 사용됩니다.
- **Fake (페이크)**: 실제 로직을 가지고는 있지만, 운영 환경에서 쓰기에는 적합하지 않은 경량화된 객체입니다. 예를 들어 실제 DB 대신 메모리상에서 동작하는 리포지토리를 구현할 때 활용할 수 있음을 보았습니다.
- **Mock (모크)**: 상태가 아닌 행동(Behavior)을 검증하기 위한 객체입니다. "이 메서드가 몇 번 불렸는가?", "어떤 인자가 전달되었는가?"를 확인하고 싶을 때 사용됩니다. 
- **Dummy (더미)**: 단순히 메서드의 인자를 채우기 위해 전달되는 객체입니다. 내부 로직은 사용되지 않으며, 존재 자체로 역할을 다하는 것을 확인했습니다.
- **Spy (스파이)**: 스텁의 역할에 더해, 메서드의 호출 기록을 몰래 저장해 두었다가 나중에 검증할 때 사용하는 객체입니다.

---

## 2. 상태 검증과 행위 검증의 균형점

테스트 더블을 활용하며 마주한 가장 큰 고민은 '무엇을 검증할 것인가'였습니다.

- **상태 검증(State Verification)**: 테스트 실행 후 객체의 값이 어떻게 변했는지 확인하는 방식입니다. 주로 Stub이나 Fake를 활용합니다.
- **행위 검증(Behavior Verification)**: 객체 간의 상호작용이 올바르게 일어났는지 확인하는 방식입니다. 주로 Mock을 활용합니다.

행위 검증에만 너무 몰두하면 내부 구현이 조금만 바뀌어도 테스트가 깨지기 쉽다는 점을 알게 되었습니다. "어떻게(How) 일했는가"보다는 "결과가 무엇(What)인가"를 우선시하되, 외부 API 호출 등 상호작용 자체가 중요한 경우에만 행위 검증을 적절히 섞어 쓰는 유연함이 필요함을 깨달았습니다.

---

## 3. 실전 예제: 상황별 테스트 더블 구현

단순한 이론을 넘어, 실제로 인터페이스를 대행하는 세 가지 주요 테스트 더블을 코드로 구현하며 그 차이를 확인해 보았습니다.

### 샌드박스: 사용자 저장소 인터페이스의 다양한 대역들

```typescript
/**
 * 테스트 더블(Test Double)의 다양한 형태를 시뮬레이션하기 위한 코드입니다.
 */

export interface UserRepository {
    findById(id: number): { id: number; name: string } | null;
    save(user: { id: number; name: string }): void;
}

// 1. Stub (스텁): 정해진 답변만 하는 단순 대역
export class UserRepoStub implements UserRepository {
    findById(id: number) {
        return { id: 1, name: "Stub User" };
    }
    save(user: any) {}
}

// 2. Fake (페이크): 실제 DB 대신 메모리를 사용하는 경량 대역
export class UserRepoFake implements UserRepository {
    private users = new Map<number, { id: number; name: string }>();
    findById(id: number) {
        return this.users.get(id) || null;
    }
    save(user: { id: number; name: string }) {
        this.users.set(user.id, user);
    }
}

// 3. Mock (모크): 호출 기록을 남겨 '행위'를 감시하는 대역
export class UserRepoMock implements UserRepository {
    public saveCalledCount = 0;
    public lastSavedUser: any = null;

    findById(id: number) { return null; }
    save(user: { id: number; name: string }) {
        this.saveCalledCount++;
        this.lastSavedUser = user;
    }
}
```

---

## 4. 유형별 동작 검증 테스트

`Vitest`를 활용해 각 대용 객체들이 의도한 테스트 목적에 맞게 작동하는지 검증을 수행했습니다. 각 테스트 케이스가 스텁의 반환값, 페이크의 상태, 모크의 호출 횟수 중 무엇을 확인하고 있는지 비교해 보는 과정이 큰 도움이 되었습니다.

### 테스트 케이스: 스텁, 페이크, 모크의 검증 방식 비교

```typescript
import { describe, it, expect } from 'vitest';
import { UserService, UserRepoStub, UserRepoFake, UserRepoMock } from '../src/examples/test-double-example';

describe('테스트 더블(Test Double) 유형별 동작 검증', () => {

    it('Stub: 메서드가 정해진 값을 반환하여 서비스의 로직을 고립시킴', () => {
        const stubRepo = new UserRepoStub();
        const service = new UserService(stubRepo);
        
        expect(service.getUserName(1)).toBe("Stub User");
    });

    it('Fake: 메모리 기반 저장소로 실제 상태 변화를 검증함', () => {
        const fakeRepo = new UserRepoFake();
        const service = new UserService(fakeRepo);
        
        service.createNewUser(10, 'Fake User');
        expect(service.getUserName(10)).toBe("Fake User");
    });

    it('Mock: save()가 정확히 1번 호출되었는지 행위를 검증함', () => {
        const mockRepo = new UserRepoMock();
        const service = new UserService(mockRepo);
        
        service.createNewUser(99, 'Mock User');
        
        expect(mockRepo.saveCalledCount).toBe(1);
        expect(mockRepo.lastSavedUser.name).toBe('Mock User');
    });
});
```

---

## 💡 마치며: 외부를 격리하고 본연의 로직에 집중하기

테스트 더블을 학습하며 느낀 점은, "테스트가 어려우면 설계가 잘못된 것일 수도 있다"는 경고의 메시지였습니다. 외부 의존성이 너무 많아 대역 배우들이 수십 명씩 동원되어야 하는 테스트라면, 객체 간의 결합도가 너무 높지는 않은지 되돌아봐야 함을 알게 되었습니다. 

앞으로는 테스트 더블을 단순히 가짜 데이터를 만드는 용도로만 쓰지 않고, 코드의 결합도를 측정하는 척도로 활용하며 더 깔끔하고 견고한 애플리케이션을 고민해 보려 합니다.
