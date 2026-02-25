---
title: "폼 관리의 정석: React Hook Form과 Zod로 타입 안전한 유효성 검사 구현하기"
description: "회원가입, 주문서 작성 등 복잡한 폼을 어떻게 관리하나?"
date: "2026-02-25"
tags: ["Frontend", "React"]
---

# 폼 관리의 정석: React Hook Form과 Zod로 타입 안전한 유효성 검사 구현하기

웹 서비스에서 '폼(Form)'은 사용자와 상호작용하는 핵심 창구입니다. 하지만 입력 항목이 많아질수록 서버로 보내기 전 데이터의 유효성을 체크하는 로직은 기하급수적으로 복잡해집니다.

[`sparta-msa-final-project`](https://github.com/eatdu0918/sparta-msa-final-project)에서는 성능 최적화와 타입 안정성을 모두 잡기 위해 **React Hook Form**과 **Zod**를 조합하여 사용했습니다.

---

## 💎 왜 이 조합인가요?

1.  **React Hook Form**: 비제어 컴포넌트 방식을 사용하여, 입력할 때마다 전체 페이지가 리렌더링되는 성능 문제를 해결합니다.
2.  **Zod**: "스키마(Schema)" 기반의 유효성 검사 라이브러리입니다. 단순히 값의 형태만 체크하는 게 아니라, 타입 정의까지 자동으로 추출(`infer`)해 줍니다.
3.  **zodResolver**: 이 둘을 이어주는 다리 역할을 하며, 스키마 검증 결과에 따라 Hook Form의 에러 상태를 자동으로 업데이트해 줍니다.

---

## 🛠️ 실전 코드 분석: 회원가입 페이지 (`SignupPage.tsx`)

이  프로젝트의 회원가입 로직은 매우 정교한 유효성 검사 규칙을 가지고 있습니다.

### 1. 검증 스키마 정의 (Zod)
먼저, 어떤 데이터가 들어와야 하는지 '설계도'를 그립니다.

```typescript
const signupSchema = z.object({
    email: z.string().email('올바른 이메일 형식이 아닙니다.'),
    password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
    confirmPassword: z.string(),
    name: z.string().min(2, '이름을 2자 이상 입력해주세요.'),
    phoneNumber: z.string().regex(/^\d{2,3}-\d{3,4}-\d{4}$/, '올바른 전화번호 형식(010-0000-0000)이 아닙니다.'),
    gender: z.enum(['MALE', 'FEMALE']),
}).refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"], // 에러가 표시될 위치
});
```

### 2. Hook Form과 연결
`useForm` 훅에 위에서 만든 스키마를 주입합니다.

```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
});
```

### 3. UI 렌더링 및 에러 표시
`register` 함수를 인풋에 뿌려주기만 하면 끝입니다. 별도의 `onChange` 핸들러가 필요 없습니다.

```tsx
<form onSubmit={handleSubmit(onSubmit)}>
    <input 
        type="email" 
        {...register('email')} 
        className={errors.email ? 'border-red-500' : 'border-stone-200'}
    />
    {errors.email && <p className="text-red-500">{errors.email.message}</p>}
    
    <button type="submit">회원가입</button>
</form>
```

---

## 💡 유효성 검사의 핵심: Refine

단순히 글자 수나 형식을 체크하는 것을 넘어, **"비밀번호와 비밀번호 확인이 일치하는가?"** 같은 비즈니스 로직은 Zod의 `.refine()` 메소드를 통해 아주 우아하게 처리할 수 있습니다. 수동으로 `if` 문을 작성하던 시절과는 차원이 다른 깔끔함을 제공합니다.

---

## 마무리

React Hook Form과 Zod를 함께 사용하면 **"코드는 줄어들고, 안정성은 올라가는"** 경험을 할 수 있습니다. 특히 TypeScript와 결합했을 때, 폼 데이터의 타입을 일일이 수동으로 정의하지 않아도 된다는 것은 개발자에게 큰 축복입니다.

이것으로 `sparta-msa-final-project` 분석을 바탕으로 한 백엔드/프론트엔드 기술 포스팅 연재 시리즈를 모두 마칩니다! 긴 여정에 함께해 주셔서 감사합니다. 여러분의 프로젝트에도 이 기술들이 날개가 되어주길 바랍니다. 🚀
