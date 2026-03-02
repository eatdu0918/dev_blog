---
title: "빨간 밑줄의 공포에서 벗어나기: TypeScript 고급 타입으로 런타임 방어막 쌓기"
description: "any와 물음표(?) 떡칠로 일관하던 과거를 반성하며, Conditional Types와 Mapped Types로 견고한 컴파일 에러를 설계한 고민의 흔적."
date: "2026-02-26"
tags: ["TypeScript", "Frontend", "Architecture", "Design Patterns"]
---

# 빨간 밑줄의 공포에서 벗어나기: TypeScript 고급 타입으로 런타임 방어막 쌓기

프론트엔드 세계에 처음 입문했을 때, 나에게 TypeScript는 그저 귀찮은 존재였다. Vscode에서 `.`을 찍었을 때 자동 완성(Intellisense)이 뜨는 건 참 좋았지만, 조금만 복잡한 객체를 다루려 하면 화면을 뒤덮는 "빨간 밑줄" 에러 때문에 스트레스가 이만저만이 아니었다.
결국 기한에 쫓기다 보면 인터페이스 곳곳에 옵셔널(`?`) 기호를 남발하거나, 최후의 보루인 `any`와 `as unknown`을 던져버리고는 "난 여전히 타입스크립트를 쓰고 있어!"라고 스스로를 기만하곤 했다.

하지만 앱이 거대해지고 권한에 따라 내려오는 API 응답 형태가 미묘하게 달라지기 시작하면서, 방치해뒀던 그 '느슨한 타입'들이 런타임에 "Cannot read property of undefined"라는 비수로 날아와 꽂히기 시작했다.
더 견고한 개발자로 도약하려면, 단순히 타입 자동 완성을 즐기는 구경꾼에서 벗어나 **타입스크립트의 에러를 무기로 삼는 설계자**가 되어야 함을 뼈저리게 느꼈다.

---

## 1. Union과 Discriminated Unions: 런타임 분기점의 수호신

예를 들어, 알림창을 띄우는데 성공/실패/로딩 상태에 따라 내려오는 데이터가 전혀 다르다고 가정해보자. 
예전의 나는 하나의 거대한 단일 인터페이스를 만들어서 필요 없는 필드까지 모조리 옵셔널(`?`) 처리해버리는 죄악을 저질렀다.

```typescript
// [과거의 부끄러운 나] : 도대체 어느 상황에 이 필드가 활성화되는 건지 알 수 없다.
interface NotificationData {
  status: 'SUCCESS' | 'ERROR' | 'LOADING';
  successMessage?: string;
  errorCode?: number;
  retryUrl?: string;
}
```

이 코드를 쓸 때마다 컴포넌트 내부에서 `if (data.successMessage)` 처럼 실제 값의 존재 유무를 따지는 불안한 런타임 검사 코드를 도배해야만 했다. 이 불안감을 없애고자 선배들의 코드를 뒤지다 발견한 것이 바로 **Discriminated Unions(판별된 유니언)** 이었다.

```typescript
// [현재의 깨달음] : 상태별로 타입을 완전히 찢어버린다.
interface SuccessNoti { status: 'SUCCESS'; successMessage: string; }
interface ErrorNoti { status: 'ERROR'; errorCode: number; retryUrl: string; }
interface LoadingNoti { status: 'LOADING'; }

type NotificationData = SuccessNoti | ErrorNoti | LoadingNoti;

function renderNotification(data: NotificationData) {
  // if문이나 switch로 'status'(판별자)를 검사하는 순간, 기적이 일어난다.
  if (data.status === 'ERROR') {
    // 이제 컴파일러는 data가 ErrorNoti임을 100% 장담하므로, 빨간 에러 없이 완벽히 추론해준다!
    console.log(data.errorCode); 
  }
}
```

내가 억지로 런타임(`if`) 방어막을 칠 필요 없이, 아키텍처 자체를 타입으로 완벽히 좁히는(Type Narrowing) 희열을 맛본 첫 순간이었다.

---

## 2. 타입이 프로그램처럼 동작한다: Conditional Types와 infer

TypeScript가 그저 명찰을 달아주는 도구가 아니라, 그 자체로 논리 연산이 가능한 '메타 언어'라는 걸 깨달은 건 `extends`와 무시무시한 `infer` 키워드를 만난 뒤였다.

특정 라이브러리 함수가 반환하는 타입이 필요한데, 그 타입이 바깥으로 export 되어 있지 않아서 직접 손으로 타이핑하다 오타를 냈던 쓰라린 기억이 있다. 이럴 때 **조건부 타입(Conditional Types)** 이 진가를 발휘했다.

```typescript
// "T가 함수 모양인지 검사(extends)하고, 맞다면 리턴부를 R로 추론(infer)해서 뽑아줘!"
type ExtractReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getDashboardData() { return { users: 100, active: true }; }

// 위 함수의 리턴 타입 형태가 완벽히 추론되어 DashboardResponse에 박힌다.
type DashboardResponse = ExtractReturnType<typeof getDashboardData>; 
```

'만약(If) ~라면 이 타입을 빼오고 아니면 버려'라는 이 프로그래밍적인 타입 조립 과정을 이해하고 나니, 그동안 두려워했던 오픈소스 라이브러리 내부의 외계어(?) 같은 제네릭 타입 파일들이 서서히 자바스크립트 코드처럼 읽히기 시작했다.

---

## 3. Mapped Types: 반복 노동에서 벗어나다

서버에서 넘겨준 DTO 인터페이스를 어드민 수정 페이지에서 쓰기 편하게 바꾸려면, 똑같은 속성에 전부 `?`를 붙이거나 `readonly`를 붙인 인터페이스를 하나 더 복사해서 손으로 치곤 했다. 바보같이 땀 흘리던 나를 비웃기라도 하듯, **Mapped Types**는 기존 타입을 마치 배열의 `.map()` 처럼 순회하며 완전히 새로운 껍데기로 탈바꿈시켜 주었다.

```typescript
interface OriginalTodo { id: number; title: string; completed: boolean; }

// 키값들을 순회하며([K in keyof T]), 모두 옵셔널을 붙이는 매핑!
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

const updateParam: MyPartial<OriginalTodo> = { title: "제목만 수정할래" };
```
물론 실무에선 내장된 `Partial<T>` 유틸리티를 쓰겠지만, 이 동작의 근본 바닥(Mapped Types)을 이해하고 나니 비로소 타입을 자유자재로 요리한다는 자신감이 붙었다.

---

## 맺으며

돌아보면, 나는 타입스크립트의 깊은 바다 표면만 떠다니며 불평하기 일쑤였다.
"빨간 밑줄"은 코딩을 방해하는 귀찮은 잔소리가 아니라, 사용자에게 가닿기 전에 내 서비스의 심장이 멎는 치명타를 컴파일 타임에 대신 맞아주는 든든한 방패였다는 사실. 

조건부 타입과 제네릭 설계라는 낯선 문법을 파고들며 머리가 뻐개지던 그 며칠 덕분에, 이제 나는 에러가 뜨지 않을까 봐 노심초사하기보다 가장 엄격한 타입을 설계하고 비즈니스 로직에만 맘 편히 몸을 던지는 더 넓은 시야를 갖추게 되었다.
