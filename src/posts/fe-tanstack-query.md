---
title: "서버 데이터 관리의 끝판왕: TanStack Query(React Query) 실전 활용"
description: "useEffect와 useState로 지저분해진 API 호출 코드를 어떻게 깔끔하게 정리했는지, sparta-msa-final-project의 구조를 공개합니다."
date: "2026-02-23"
tags: ["React", "Frontent"]
---

# 서버 데이터 관리의 끝판왕: TanStack Query(React Query) 실전 활용

React 개발을 하다 보면 가장 많이 작성하는 코드 중 하나가 바로 API 호출입니다. `useEffect`를 쓰고, 로딩 상태 값 만들고, 에러 처리하고... 이 과정을 모든 컴포넌트에서 반복하고 있다면, 코드 베이스는 금방 복잡해질 수밖에 없습니다.

[`sparta-msa-final-project`](https://github.com/eatdu0918/sparta-msa-final-project)에서는 이 문제를 해결하기 위해 서버 상태 관리 라이브러리인 **TanStack Query(v5)**를 도입했습니다.

---

## 🏗️ 도메인 중심의 API 서비스 구조

이  프로젝트는 서비스가 7개나 되는 MSA 구조입니다. 이를 프론트엔드에서 관리하기 위해 `src/api/services/` 디렉터리에 도메인별로 API 호출 로직을 완벽히 격리했습니다.

```bash
# API 서비스 구조
src/api/services/
├── product.ts  # 상품 관련 API
├── order.ts    # 주문 관련 API
├── user.ts     # 사용자 관련 API
└── ...
```

예를 들어 상품 정보를 가져오는 코드는 다음과 같이 작성됩니다.

```typescript
// src/api/services/product.ts
import api from '../axios';

export const getProduct = async (id: number) => {
    const { data } = await api.get(`/api/products/${id}`);
    return data.data;
};
```

---

## ⚡ 컴포넌트에서의 활용: 비동기를 동기처럼

TanStack Query의 가장 큰 매력은 **'선언적'**이라는 것입니다. 컴포넌트는 오직 "나는 이 데이터가 필요해!"라고만 말하면 됩니다.

```tsx
function ProductDetail({ id }: { id: number }) {
    // 단 한 줄로 데이터 조회, 로딩, 에러 처리를 끝냅니다.
    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', id],
        queryFn: () => getProduct(id),
        staleTime: 1000 * 60 * 5, // 5분 동안은 신선한 데이터로 간주 (캐싱)
    });

    if (isLoading) return <Spinner />;
    if (error) return <ErrorMessage />;

    return <div>{product.name}</div>;
}
```

### 🧐 왜 효율적인가?
1.  **자동 캐싱**: 한 번 불러온 데이터는 `queryKey`를 기준으로 캐싱됩니다. 똑같은 상품 페이지를 다시 방문해도 서버에 다시 물어보지 않고 즉시 보여줍니다.
2.  **Stale-While-Revalidate**: 백그라운드에서 데이터를 업데이트하면서 사용자에게는 일단 옛날 데이터를 보여줘서 끊김 없는 경험을 줍니다.
3.  **데이터 동기화**: `useMutation`과 `queryClient.invalidateQueries`를 사용해, 상품 정보를 수정하면 리스트 페이지의 데이터도 자동으로 최신 상태로 갱신됩니다.

---

## 💡 실전 팁: 전역 설정 활용

모든 `useQuery`에 매번 설정을 넣는 대신, `main.tsx`에서 공통 정책을 정해두면 일관성 있는 앱을 만들 수 있습니다.

```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1, // 실패 시 1번만 재시도
            refetchOnWindowFocus: false, // 창을 다시 띄울 때 자동 갱신 끄기
        },
    },
});
```

## 마무리

TanStack Query는 이제 React 생태계에서 선택이 아닌 필수입니다. 특히 많은 마이크로서비스와 통신해야 하는 복잡한 시스템일수록, 그 가치는 더욱 빛을 발합니다.

다음 포스팅에서는 서버 데이터가 아닌, UI 상태나 로그인 정보를 가볍게 관리하는 방법! **Zustand**에 대해 알아보겠습니다.
