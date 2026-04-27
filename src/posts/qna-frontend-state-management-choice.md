---
published: true
type: 'qna'
level: 'mid'
title: "프론트엔드 상태 관리 라이브러리를 어떤 기준으로 고르시나요? Redux, Zustand, Tanstack Query 중 어떤 조합을 쓰시는지요?"
date: '2026-04-26'
categories: ['Frontend', 'State Management', 'React']
---

## Q1. 상태 관리 라이브러리를 고르는 첫 번째 기준은 무엇인가요?

**A.** **서버 상태와 클라이언트 상태를 분리**하는 것입니다.

- **서버 상태**: 원본이 서버에 있고 가져온 시점부터 stale. 캐싱, 무효화, 재시도가 본질.
- **클라이언트 상태**: 원본이 브라우저에 있고 트리 안에서 살아있는 동안 유효. UI 상태, 폼, 모달, 토스트.

둘을 한 통에 담으려고 하면 어떤 도구를 써도 복잡해집니다. Redux에 fetch 코드가 잔뜩 쌓이고 로딩 상태가 액션으로 관리되는 사고가 여기서 시작됩니다.

---

## Q2. 본인의 디폴트 조합은 무엇인가요?

**A.** 신규 React 프로젝트는 다음 조합으로 시작합니다.

- **서버 상태 → Tanstack Query**: 캐싱, 백그라운드 refetch, mutation invalidation이 표준화. 손으로 짤 일이 없음.
- **클라이언트 상태 → Zustand 또는 Jotai**: 보일러플레이트 거의 없음. slice 단위로 작게 시작해서 점진 확장.
- **폼 상태 → React Hook Form + Zod**: 리렌더 비용 작고 스키마 기반 검증이 깔끔.

---

## Q3. Redux는 이제 안 쓰시는 건가요?

**A.** 그렇진 않습니다. 다만 **대부분의 프로덕트에서 과합니다**.

Redux를 다시 고르는 경우:
- 매우 큰 SPA에서 시간 여행 디버깅이 실제로 도움이 됨.
- 그래프 에디터/캔버스처럼 모든 액션을 직렬화/리플레이해야 하는 워크플로우.
- 팀이 이미 Redux에 깊이 익숙해서 다른 라이브러리 학습 비용이 더 큼.

도구 선택은 **팀의 학습 곡선과 운영 비용**도 함께 봐야 합니다.

---

## Q4. 전역 상태에 무엇을 둬야 하나요?

**A.** **여러 라우트나 트리 전반에서 필요한 것만**입니다.

"props drilling이 귀찮아서"는 잘못된 이유입니다. 그건 컴포지션이나 Context로 푸는 게 보통 더 가볍습니다. 전역 상태는 다음 같은 것들이 적합합니다.

- 로그인 사용자 정보.
- 테마/언어 같은 앱 전반 설정.
- 멀티 페이지에서 공유되는 카트, 노티피케이션.

---

## Q5. URL과 상태 관리는 어떻게 연결하시나요?

**A.** **URL/쿼리 파라미터로 표현 가능한 상태는 URL을 single source of truth**로 둡니다.

검색어, 필터, 페이지 번호 같은 상태:
- URL에 두면 새로고침, 공유, 뒤로가기에 강함.
- Tanstack Query가 URL을 키로 자동 캐시.
- 별도 전역 상태가 필요 없음.

이 패턴 하나로 상당히 많은 클라이언트 상태가 사라집니다.

---

## Q6. 낙관적 업데이트는 어떻게 구현하시나요?

**A.** Tanstack Query의 **`onMutate`** 훅을 씁니다.

```javascript
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries(['todos']);
    const prev = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], old => [...old, newTodo]);
    return { prev };
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.prev);
  },
  onSettled: () => queryClient.invalidateQueries(['todos']),
});
```

`onMutate`에서 즉시 UI 갱신, `onError`에서 롤백, `onSettled`에서 서버 동기화. 한 곳에서 끝나는 게 장점입니다.

---

## Q7. Context API와 라이브러리는 어떻게 구분하시나요?

**A.** **변경 빈도**로 결정합니다.

- **Context**: 거의 변하지 않는 값(테마, 인증된 사용자, i18n). consumer가 많아도 리렌더 폭발이 없음.
- **상태 라이브러리**: 자주 바뀌는 값. selector 패턴으로 필요한 부분만 구독해 리렌더 최소화.

Context에 자주 바뀌는 값을 넣으면 트리 전체가 리렌더됩니다. 라이브러리(zustand 등)는 selector로 격리해줍니다.

---

## Q8. SSR/RSC 환경에서 상태 관리는 어떻게 달라지나요?

**A.** 클라이언트 상태가 줄어드는 방향으로 갑니다.

- **Tanstack Query**: hydration 패턴으로 SSR에서 prefetch한 데이터를 클라이언트로 직렬화 전달.
- **Zustand**: server snapshot 처리 + 직렬화 안 되는 값 주의.
- **RSC**: 서버 컴포넌트는 상태가 없음. 클라이언트 컴포넌트로 경계를 그어 그 안에서만 상태 라이브러리 사용.

데이터 fetching을 서버로 최대한 옮기고 클라이언트 상태를 줄이는 방향이 트렌드입니다.
