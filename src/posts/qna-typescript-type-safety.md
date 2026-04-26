---
published: true
type: 'qna'
level: 'mid'
title: "TypeScript의 타입 안정성을 어떻게 활용해서 런타임 버그를 줄이시나요?"
date: '2026-04-26'
categories: ['TypeScript', 'Frontend', 'Quality']
---

## 핵심 요약

타입 안정성을 진짜로 누리려면 **(1) 외부 경계에서 검증**, **(2) 내부 데이터 모델링으로 잘못된 상태를 표현 불가능하게**, **(3) 컴파일러를 strict하게** 세 가지 축이 같이 가야 합니다. `any`만 안 쓰는 건 시작일 뿐입니다.

## 1. 외부 경계에서 검증

TypeScript 타입은 컴파일 타임에만 존재합니다. 네트워크 응답을 `as User`로 단언해도 런타임에는 어떤 모양이든 들어올 수 있습니다.

저는 외부 입력(API 응답, URL 쿼리, localStorage, 사용자 입력)을 받는 모든 지점에서 **Zod / Valibot 같은 런타임 스키마**로 검증합니다.

```typescript
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'member']),
});
type User = z.infer<typeof UserSchema>;

const user = UserSchema.parse(await response.json()); // 실패 시 즉시 에러
```

이렇게 하면 TS 타입과 런타임 검증이 한 곳에서 발생하니 두 진실(`type`과 검증 코드)이 갈라지지 않습니다.

## 2. 잘못된 상태를 표현 불가능하게

타입 안정성의 본질은 **"불가능한 상태를 만들 수 없게"** 하는 데 있습니다.

### Discriminated Union

옵셔널 필드를 잔뜩 둔 객체는 컴파일러가 검증을 못 해줍니다. 상태를 union으로 갈라내면 컴파일러가 강제할 수 있습니다.

```typescript
// 나쁜 예: 한 객체에 다 담음
type RequestState = {
  loading: boolean;
  data?: User;
  error?: Error;
};

// 좋은 예: 상태별로 분기
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };
```

후자는 `data`에 접근하기 전에 status가 success인지 확인하지 않으면 컴파일이 안 됩니다.

### Branded Type

`UserId`와 `OrderId`가 둘 다 `string`이면 서로 섞여도 모릅니다. 브랜딩으로 구분 가능하게 만들면 함수 시그니처에 잘못된 ID를 넘기는 사고가 컴파일 타임에 잡힙니다.

```typescript
type UserId = string & { readonly __brand: 'UserId' };
type OrderId = string & { readonly __brand: 'OrderId' };
```

### exhaustiveness check

union을 switch로 처리할 때 `default: const _exhaustive: never = x`를 두면, 새 케이스가 추가되었는데 처리를 빠뜨리면 컴파일이 깨집니다.

## 3. tsconfig를 엄격하게

다음 옵션은 의식적으로 켭니다.

- `strict: true`: 기본 안전망.
- `noUncheckedIndexedAccess: true`: `arr[i]`가 `T | undefined`로 추론되어 인덱스 접근 후 검증을 강제.
- `exactOptionalPropertyTypes: true`: `?:` 필드와 `| undefined`를 구분해 의도를 명확히.
- `noImplicitOverride: true`: 메서드 오버라이드 시 `override` 키워드를 강제.

`noUncheckedIndexedAccess`는 도입 시 코드를 여러 곳 손대야 하지만, 도입 후 잡히는 버그가 가장 큰 옵션입니다.

## 자주 보는 안티패턴

- **`any` 대신 `unknown`**: 외부 입력은 `unknown`으로 받고 좁혀가는 습관.
- **타입 단언(`as`) 남발**: 단언은 "내가 컴파일러보다 잘 안다"는 약속이고, 자주 거짓말이 됩니다. parse/guard 함수를 거치는 게 안전.
- **함수 반환 타입 미지정**: 추론에 맡기면 큰 변경에 의도치 않은 타입 누수가 발생. public 함수는 반환 타입을 명시.
- **enum vs union**: 단순 문자열 union이 가볍고 충돌이 없습니다. enum은 런타임 객체를 만들고 트리쉐이킹 영향이 있어 신중히.

## 면접 follow-up

- "런타임 타입 검증은 비용이 크지 않나요?" → 외부 경계에서만 한다면 비용은 작고, 디버깅 시간을 압도적으로 줄여줍니다.
- "조건부 타입(Conditional Type)을 어디까지 쓰시나요?" → 라이브러리 작성에는 필수, 애플리케이션 코드에서는 가독성을 우선. 너무 영리한 타입은 동료를 막습니다.
- "TS와 React Server Component 결합?" → 서버/클라이언트 경계에서 직렬화 가능한 타입만 넘어갈 수 있게 컴파일러가 도와줍니다(특히 `'use server'` action 시그니처).
