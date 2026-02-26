---
title: "React 폼 관리 리팩토링: useState에서 React Hook Form과 Zod로"
description: "복잡한 폼 상태와 유효성 검사 로직으로 인해 발생한 렌더링 지연 문제를 React Hook Form과 Zod를 통해 개선한 경험을 공유합니다."
date: "2026-02-25"
tags: ["Frontend", "React"]
---

# React 폼 관리 리팩토링: useState에서 React Hook Form과 Zod로

초창기 리액트 프로젝트에서 로그인이나 회원가입 페이지를 만들 때, 모든 input 요소의 값을 `useState`로 관리하고 매번 `onChange` 이벤트로 상태를 갱신했습니다.

단순한 폼에서는 문제가 없었으나, 10개가 넘는 항목을 입력받고 복잡한 유효성 검사(비밀번호 중복 확인, 정규식 매칭 등)가 필요한 페이지에서는 치명적인 문제들이 드러나기 시작했습니다. 이를 해결하기 위해 폼 라이브러리를 도입하고 리팩토링했던 경험을 기록합니다.

---

## 🚨 기존 방식의 한계

### 1. 무의미한 리렌더링 폭탄
이름을 한 글자 타이핑할 때마다 상태가 변하면서 폼이 속한 거대한 컴포넌트 전체가 리렌더링되었습니다. 타이핑 시 약간의 지연(Lag)이 발생할 정도로 체감 성능이 떨어졌습니다.

### 2. 난잡한 유효성 검사 로직
비밀번호가 6자 이상인지, 특수문자가 포함되었는지, '비밀번호 확인'란과 일치하는지를 일일이 `if/else` 문으로 검사하고 텍스트를 칠해주는 코드가 비즈니스 로직과 강하게 결합되어 가독성을 심각하게 해쳤습니다.

---

## 💎 React Hook Form과 Zod의 도입

이러한 문제를 타파하기 위해 **비제어 컴포넌트** 방식을 사용하여 렌더링 성능을 챙길 수 있는 `React Hook Form`과, 스키마 기반 유효성 컴증 도구인 `Zod`를 도입했습니다.

### 1. 관심사 분리: 스키마 정의 (Zod)
컴포넌트 내부에서 장황하게 검사하던 로직을 외부 파일의 '스키마(Schema)' 설정으로 분리해 냈습니다.

```typescript
// 유효성 규칙을 별도로 정의
const signupSchema = z.object({
    email: z.string().email('이메일 형식이 올바르지 않습니다.'),
    password: z.string().min(6, '최소 6자 이상이어야 합니다.'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 상호 일치하지 않습니다.",
    path: ["confirmPassword"],
});
```

### 2. 비제어 컴포넌트 렌더링 (React Hook Form)
상태 변화마다 리렌더링되지 않도록 기존 `useState`를 걷어내고, `useForm`에서 내려준 `register` 함수를 인풋에 직접 연결하여 코드를 크게 축소했습니다.

```tsx
const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema), // Zod 스키마와 폼을 연결
});

<form onSubmit={handleSubmit(onSubmit)}>
    <input type="email" {...register('email')} />
    {errors.email && <span>{errors.email.message}</span>}
    
    {/* 기타 입력 필드 동일하게 적용 */}
</form>
```

---

## 💡 회고

도입 이후, 입력창에 타이핑할 때마다 컴포넌트 전체가 재조정(Re-render)되며 발생하던 지연 현상이 완벽하게 사라졌습니다. 비제어 컴포넌트를 효과적으로 다루는 방법을 체득할 수 있었습니다.

더불어 "전화번호 형식을 다르게 검사해 달라"는 등의 요구사항 변경이 왔을 때, 컴포넌트의 중심 UI 코드는 전혀 건드리지 않고 스키마 로직만 수정하면 되어 유지보수의 관심사가 훌륭하게 분리되었음을 체감했습니다. 데이터 검증과 상태 관리를 적절한 도구에 위임하고 컴포넌트 본연의 UI 렌더링 역할에 집중하도록 구조를 짜는 훈련이 되었습니다.
