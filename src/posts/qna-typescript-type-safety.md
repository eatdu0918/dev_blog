---
published: true
type: 'qna'
level: 'mid'
title: "TypeScript의 타입 안정성을 어떻게 활용해서 런타임 버그를 줄이시나요?"
date: '2026-04-26'
categories: ['TypeScript', 'Frontend', 'Quality']
---

## Q1. TypeScript의 타입 안정성을 어떻게 활용하시나요?

**A.** 3가지 축이 같이 가야 합니다.

1. **외부 경계에서 런타임 검증**(Zod 등).
2. **불가능한 상태를 표현 불가능하게** 모델링.
3. **컴파일러를 strict하게** 설정.

`any`만 안 쓰는 건 시작일 뿐입니다.

---

## Q2. TypeScript 타입을 믿으면 안 되는 경우는?

**A.** **외부 입력**입니다. TypeScript 타입은 **컴파일 타임에만 존재**하므로 네트워크 응답을 `as User`로 단언해도 런타임엔 어떤 모양이든 들어올 수 있습니다.

해결: 외부 입력(API 응답, URL 쿼리, localStorage, 폼 데이터)을 받는 지점에서 **Zod/Valibot** 같은 런타임 스키마로 검증.

```typescript
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});
type User = z.infer<typeof UserSchema>;

const user = UserSchema.parse(await response.json());
```

---

## Q3. Discriminated Union을 왜 쓰시나요?

**A.** **잘못된 상태를 컴파일러가 잡아주게** 만들기 위해서입니다.

```typescript
// ❌ 한 객체에 다 담음 — 컴파일러가 검증 못함
type State = { loading: boolean; data?: User; error?: Error; };

// ✅ 상태별로 갈라냄 — 컴파일러가 강제
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };
```

후자는 `data`에 접근하기 전에 status가 success인지 검사하지 않으면 컴파일 에러가 납니다.

---

## Q4. Branded Type은 무엇이고 언제 쓰나요?

**A.** **같은 primitive 타입(string, number)을 의미별로 구분**하는 패턴입니다.

```typescript
type UserId = string & { readonly __brand: 'UserId' };
type OrderId = string & { readonly __brand: 'OrderId' };

function deleteUser(id: UserId) { ... }
deleteUser(orderId); // ❌ 컴파일 에러
```

UserId와 OrderId가 둘 다 string이면 함수에 잘못 넘겨도 모르지만, 브랜딩하면 컴파일 타임에 잡힙니다. ID/돈/단위처럼 의미가 중요한 값에 효과적입니다.

---

## Q5. exhaustiveness check는 어떻게 구현하나요?

**A.** `never` 타입으로 강제합니다.

```typescript
function handle(state: State) {
  switch (state.status) {
    case 'idle': return ...;
    case 'loading': return ...;
    case 'success': return ...;
    case 'error': return ...;
    default: const _: never = state;  // 새 case 추가 시 컴파일 에러
  }
}
```

union에 새 케이스가 추가되면 default가 더 이상 never가 아니라 컴파일이 깨집니다. 이렇게 하면 **새 상태 추가 시 처리 누락**을 자동으로 발견합니다.

---

## Q6. tsconfig 옵션 중 무엇을 strict하게 켜시나요?

**A.** 4가지가 효과 큽니다.

- **`strict: true`**: 기본 안전망 묶음.
- **`noUncheckedIndexedAccess: true`**: `arr[i]`가 `T | undefined`로 추론. 인덱스 접근 후 검증 강제.
- **`exactOptionalPropertyTypes: true`**: `?:`와 `| undefined`를 구분.
- **`noImplicitOverride: true`**: 메서드 오버라이드 시 `override` 키워드 강제.

`noUncheckedIndexedAccess`는 도입 시 코드 여러 곳을 손대야 하지만, 도입 후 잡히는 버그가 가장 큽니다.

---

## Q7. any 대신 무엇을 쓰시나요?

**A.** **`unknown`** 입니다.

- `any`: 모든 연산 허용. 타입 검사 안 함.
- `unknown`: 값은 받지만 **사용 전에 좁혀야** 함.

```typescript
function parse(raw: unknown) {
  if (typeof raw === 'string') return raw.toUpperCase(); // OK
  return null;
}
```

외부 입력은 `unknown`으로 받고 type guard나 schema validation으로 좁혀가는 게 안전합니다.

---

## Q8. 타입 단언(`as`)을 언제 쓰시나요?

**A.** **거의 안 씁니다**. 단언은 "컴파일러보다 내가 잘 안다"는 약속이고 자주 거짓말이 됩니다.

대안:
- **type guard 함수**: `function isUser(x: unknown): x is User`.
- **schema parse**: Zod 등.
- **만족 가능한 만큼 narrowing**.

`as` 사용이 정당한 경우는 DOM API의 `element as HTMLInputElement` 같이 컴파일러가 알 수 없는 외부 정보가 명백할 때 정도입니다.

---

## Q9. enum vs string union 중 무엇을 쓰시나요?

**A.** **string union**을 권장합니다.

```typescript
// ❌ enum
enum Role { Admin = 'admin', Member = 'member' }

// ✅ union
type Role = 'admin' | 'member';
```

이유:
- enum은 런타임 객체 생성 → 번들 사이즈 증가, 트리쉐이킹 영향.
- string union은 컴파일 타임만의 추상.
- JS 친화적 + 직렬화/네트워크 전송 시 변환 불필요.

---

## Q10. 함수 반환 타입은 명시하시나요?

**A.** **public 함수와 라이브러리 export는 명시** 권장입니다.

```typescript
// ❌ 추론에 맡김 — 큰 변경 시 의도치 않은 타입 누수
function getUser() { /* ... */ }

// ✅ 명시
function getUser(): User | null { /* ... */ }
```

추론에 의존하면 함수 본문 변경이 외부 시그니처를 조용히 바꿉니다. 명시하면 의도와 다른 변경이 컴파일 에러로 드러납니다.

내부 헬퍼 함수는 추론에 맡겨도 됩니다 — 균형이 중요합니다.
