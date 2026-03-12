---
title: "데이터 동화 현상을 발견하다: Single Source of Truth(SSoT) 설계 탐색기"
date: "2026-03-12"
excerpt: "데이터가 여러 곳에서 각각 관리될 때 발생하는 불일치 문제를 해결하기 위한 SSoT(Single Source of Truth) 설계에 대해 학습하고 정리한 기록입니다."
tags: ["Architecture"]
---

최근 소규모 프로젝트를 진행하면서 당혹스러운 버그를 마주했다. 사용자 프로필 수정 페이지에서 이름을 변경했는데, 헤더에 표시되는 이름은 여전히 예전 이름 그대로 남아 있는 것이었다. 새로고침을 하면 해결되지만, SPA(Single Page Application) 환경에서 매번 새로고침을 유도할 수는 없는 노릇이었다.

처음에는 단순히 "수정 완료 후 헤더의 상태도 같이 업데이트해주면 되겠지"라고 가볍게 생각했다. 하지만 이런 식으로 업데이트가 필요한 모든 컴포넌트를 일일이 건드리는 방식은 프로젝트 규모가 커질수록 유지보수의 지옥이 될 것 같다는 직감이 들었다.

이 문제를 어떻게 더 근본적으로 해결할 수 있을지 고민하며 서칭을 시작했고, **Single Source of Truth(SSoT, 단일 진실 공급원)**라는 개념을 발견하게 되었다.

![SSoT 설계 개념도](/public/images/ssot-concept.png)

## SSoT: 진실은 오직 한 곳에 존재해야 한다

서칭을 통해 이해한 SSoT의 핵심은 명확했다. **"모든 데이터 요소는 오직 하나의 주인을 가져야 하며, 그 데이터가 필요한 다른 곳들은 주인으로부터 정보를 제공받아야 한다"**는 것이다.

데이터가 파편화되어(Fragmented) 여러 컴포넌트가 각자 같은 데이터의 '복사본'을 가지고 있게 되면, 그중 하나가 변경되었을 때 나머지는 '거짓' 정보를 담고 있는 상태가 된다. 이것이 내가 겪었던 데이터 불일치의 원인이었다.

### 내가 시도해 본 SSoT 구현 방식

단순히 이론만 읽기보다는, 간단하게 스토어(Store) 패턴을 활용해 SSoT를 시뮬레이션해 보았다.

```typescript
// src/examples/ssot-example.ts

export class UserStore {
  private static instance: UserStore;
  private user: User | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  // 싱글톤 패턴을 사용하여 애플리케이션 전체에서 단 하나의 인스턴스만 보장
  public static getInstance(): UserStore {
    if (!UserStore.instance) {
      UserStore.instance = new UserStore();
    }
    return UserStore.instance;
  }

  // 상태 변경 시 모든 구독자에게 알림
  public updateName(newName: string): void {
    if (this.user) {
      this.user = { ...this.user, name: newName };
      this.notify();
    }
  }

  public subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.user);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.user));
  }
}
```

이 구조를 사용하면 헤더 컴포넌트든, 프로필 페이지든 모두 `UserStore`라는 '단일 공급원'을 구독하게 된다. 이제 프로필 페이지에서 `updateName`을 호출하기만 하면, 헤더는 별도의 추가 작업 없이도 자동으로 최신 '진실'을 반영하게 된다.

### 테스트를 통한 검증

실제로 이 설계가 의도대로 동작하는지 확인하기 위해 테스트 코드를 작성해 보았다.

```typescript
// test/ssot.test.ts
test('SSoT 스토어를 통해 모든 구독자가 최신 데이터를 유지해야 한다', () => {
  const store = UserStore.getInstance();
  let headerName = '';
  let mainContentName = '';

  // 여러 곳에서 스토어 구독
  store.subscribe((user) => { headerName = user?.name || ''; });
  store.subscribe((user) => { mainContentName = user?.name || ''; });

  // 데이터 변경
  store.updateName('New Name');

  // 모든 곳이 동일한 '진실'을 보고 있는지 확인
  expect(headerName).toBe('New Name');
  expect(mainContentName).toBe('New Name');
});
```

결과는 성공적이었다. 데이터를 각자 들고 있을 때는 발생했던 '데이터 어긋남' 현상이, 소스를 하나로 합치니 말끔히 해결되었다.

## 학습을 마치며: 설계의 힘

이번 탐색을 통해 느낀 점은, 단순히 코드를 짜는 것보다 **'데이터의 흐름을 어떻게 설계하느냐'**가 훨씬 중요하다는 사실이다. SSoT는 자칫 복잡해질 수 있는 상태 관리 문제를 "누가 진실인가?"라는 단 하나의 질문으로 단순화해 주었다.

물론 모든 데이터를 하나의 SSoT로 관리하는 것이 항상 정답은 아닐 수도 있다(예를 들어, 폼 내부의 임시 상태 등). 하지만 '애플리케이션 전체가 공유해야 하는 데이터'만큼은 반드시 SSoT 원칙을 지켜야 한다는 소중한 교훈을 얻었다. 

앞으로 React의 Redux나 Vue의 Vuex, 혹은 간단한 Context API 등을 사용할 때도, 그 기저에는 이 SSoT라는 철학이 깔려 있음을 기억하며 설계에 임해야겠다.
