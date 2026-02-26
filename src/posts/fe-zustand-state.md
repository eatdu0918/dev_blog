---
published: true
title: "React 상태 관리 리팩토링: Redux에서 Zustand로"
description: "과도한 보일러플레이트 코드로 유지보수 효율이 떨어졌던 전역 상태 관리를 Zustand를 통해 단순화한 경험을 기록합니다."
date: "2026-02-25"
tags: ["React", "Frontend"]
---

# React 상태 관리 리팩토링: Redux에서 Zustand로

초기 React 학습 시절, 전역 상태 관리는 오직 Redux만이 정답이라고 생각했습니다. "모달 창 하나를 띄우기 위해서라도 규칙을 지켜야 한다"는 압박감에 수많은 코드를 작성했던 뼈아픈 경험이 있습니다.

이후 팀 프로젝트를 진행하면서 상태 관리의 복잡도를 낮추기 위해 **Zustand**를 도입하고, 순수 UI 상태 관리를 효율적으로 개선한 사례를 회고해 봅니다.

---

## 🐻 잦은 리렌더링과 깊어진 러닝 커브

Redux 기반의 프로젝트 구조에서는 하나의 상태(예: `isModalOpen`)를 추가할 때마다 `Action`, `Reducer`, `Dispatch` 타입을 정의해야 했습니다. 이는 파일의 개수를 기하급수적으로 늘렸고, 새로운 상태를 추가하는 작업 자체를 꺼려지게 만들었습니다.

Zustand는 상태(State)와 변경 액션(Action) 함수를 직관적으로 묶어 스토어를 생성할 수 있어 이러한 러닝 커브와 작성 비용을 획기적으로 낮춰주었습니다.

---

## 🛠️ 실무 적용: UI 공통 스토어 만들기

뷰 구성에 필요한 전역 상태(모달 여부, 사용자 정보 등)를 관리하는 스토어 구현부를 살펴보겠습니다.

```typescript
import { create } from 'zustand';

interface UIState {
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
    
    user: object | null;
    setUser: (user: object) => void;
}

export const useUIStore = create<UIState>((set) => ({
    // 초기 상태 세팅
    isLoginModalOpen: false,
    user: null,

    // 변경 로직(Action) 정의
    openLoginModal: () => set({ isLoginModalOpen: true }),
    closeLoginModal: () => set({ isLoginModalOpen: false }),
    setUser: (user) => set({ user }),
}));
```

### 컴포넌트 호출
`Provider` 컴포넌트로 최상단을 감쌀 필요도 없이, 필요한 곳에서 훅(Hook) 형태로 바로 꺼내 쓸 수 있었습니다.

```tsx
function Header() {
    // 필요한 데이터와 액션만 선택적으로 구독
    const { user, openLoginModal } = useUIStore();

    return (
        <header>
            {user ? (
                <span>반갑습니다!</span>
            ) : (
                <button onClick={openLoginModal}>로그인</button>
            )}
        </header>
    );
}
```

---

## ✨ 영속성(Persistence) 유지의 간편함

과거에는 새로고침 시 로그인 정보가 날아가는 것을 막기 위해 `useEffect` 컴포넌트 단에서 `localStorage`를 읽어오고 수동으로 스토어와 싱크를 맞췄습니다. Zustand는 미들웨어(middleware)를 통해 이를 선언적으로 처리해 주었습니다.

```typescript
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            token: null,
            setToken: (token) => set({ token }),
        }),
        { name: 'auth-storage' } // localStorage 연동
    )
);
```

---

## 💡 회고

과거의 저는 '앱 전체의 모든 데이터 동기화'를 하나의 라이브러리(Redux)가 모두 책임져야 한다고 생각했습니다.

현재는 **서버 데이터 캐싱과 비동기 처리는 React Query**로 격리하고, **순수 클라이언트 UI 상태(다크모드, 모달 열림 등)는 Zustand**처럼 동작이 직관적인 라이브러리에 위임하는 식으로 관심사를 쪼개는 방법을 터득하게 되었습니다. 아키텍처는 무조건 무거운 도구를 쓰는 것이 아니라 적재적소의 도구를 조합할 때 안정성이 커진다는 점을 체감할 수 있었습니다.
