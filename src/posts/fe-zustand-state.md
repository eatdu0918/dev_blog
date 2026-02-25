---
title: "안녕 Redux, 반가워 Zustand: 한없이 가벼운 React 상태 관리"
description: "sparta-msa-final-project에서 복잡한 전역 상태 관리를 어떻게 단 몇 줄의 코드로 단순화했는지, Zustand 활용 팁을 전수합니다."
date: "2026-02-25"
tags: ["React", "Frontend"]
---

# 안녕 Redux, 반가워 Zustand: 한없이 가벼운 React 상태 관리

React 앱이 커지면 늘 따라붙는 고민이 있습니다. "모달 상태, 로그아웃 유무... 이걸 어떻게 모든 컴포넌트에 공유하지?" 예전엔 Redux가 유일한 정답인 줄 알았지만, 수많은 보일러플레이트 코드와 복잡함에 지치곤 했습니다.

[`sparta-msa-final-project`](https://github.com/eatdu0918/sparta-msa-final-project)에서는 그 해답으로 **Zustand**를 선택했습니다. 왜 Zustand가 매력적인지, 실제 프로젝트 코드를 통해 살펴보겠습니다.

---

## 🐻 Zustand: 왜 좋은가요?

1.  **극도로 단순합니다**: Redux처럼 `Action`, `Reducer`, `Dispatch`를 만들 필요가 없습니다. 그냥 상태(State)와 변경 함수(Action)를 하나로 뭉쳐서 정의하면 끝입니다.
2.  **제로 보일러플레이트**: 설정 코드가 거의 없습니다. `Provider`로 감싸지 않아도 어디서든 꺼내 쓸 수 있습니다.
3.  **성능 최적화**: 특정 상태가 변할 때 리렌더링될 컴포넌트를 정교하게 선택할 수 있습니다.

---

## 🛠️ 실무 적용: UI 공통 스토어 만들기

이  프로젝트의 `src/store/useUIStore.ts`는 앱 전체의 모달이나 알림 상태를 관리합니다.

```typescript
import { create } from 'zustand';

interface UIState {
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
    
    user: any | null;
    setUser: (user: any) => void;
}

export const useUIStore = create<UIState>((set) => ({
    // 초기 상태
    isLoginModalOpen: false,
    user: null,

    // 변경 로직 (Action)
    openLoginModal: () => set({ isLoginModalOpen: true }),
    closeLoginModal: () => set({ isLoginModalOpen: false }),
    setUser: (user) => set({ user }),
}));
```

### 컴포넌트에서 사용하기 (너무 쉽습니다!)

```tsx
function Header() {
    // 필요한 데이터와 함수만 쏙 제안서
    const { user, openLoginModal } = useUIStore();

    return (
        <header>
            {user ? (
                <span>반가워요, {user.name}님!</span>
            ) : (
                <button onClick={openLoginModal}>로그인</button>
            )}
        </header>
    );
}
```

---

## ✨ Zustand 더 깊이 활용하기: 영속성(Persistence)

로그인 정보 같은 데이터는 페이지를 새로고침해도 유지되어야 합니다. Zustand의 `persist` 미들웨어를 쓰면 단 한 줄로 `localStorage` 연동이 끝납니다.

```typescript
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            token: null,
            setToken: (token) => set({ token }),
        }),
        { name: 'auth-storage' } // localStorage 키 이름
    )
);
```

---

## 💡 실전 조언: Zustand vs React Query

- **Zustand**: UI의 상태(모달 열림, 다크모드), 로컬 설정, 사용자 정보 등 **순수 프론트엔드 상태**에 쓰세요.
- **React Query**: 서버에서 가져오는 **데이터**에 쓰세요.

이  프로젝트처럼 두 도구를 적절히 섞어 쓰면, 컴포넌트 로직이 놀라울 정도로 깔끔해지는 마법을 경험할 수 있습니다!

## 마무리

Zustand는 "상태 관리는 어려워야 한다"는 편견을 깨준 도구입니다. 가볍고 강력한 이 곰돌이와 함께라면, 사이드 프로젝트부터 거대한 MSA 프로젝트까지 두렵지 않습니다.

다음 포스팅에서는 이  앱을 글로벌하게! **i18next**를 이용한 다국어 처리 방법을 소개하겠습니다.
