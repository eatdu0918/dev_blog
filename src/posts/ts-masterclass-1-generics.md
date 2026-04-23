---
published: true
title: "TypeScript 마스터하기 Part 1: 오픈소스 엔진의 기초 - Generic Constraints & Inference"
description: "단순한 타입을 넘어 라이브러리 수준의 추론 능력을 갖추기 위한 첫 단계. Generic extends와 infer의 핵심 원리를 파헤칩니다."
date: "2026-04-23"
tags: ["TypeScript"]
---

# TypeScript 마스터하기 Part 1: 오픈소스 엔진의 기초 - Generic Constraints & Inference

TypeScript 전문가로 가는 여정의 가장 낮은 문턱이자, 동시에 가장 높은 벽이 바로 **제네릭(Generics)**이다. 단순히 `T`라는 문자를 사용하는 수준을 넘어, 수만 명의 개발자가 사용하는 오픈소스 라이브러리(`type-fest`, `Zod`, `React` 등)들이 어떻게 타입을 '강제'하고 '추출'하는지 그 기초 설계 철학을 들여다본다.

---

## 1. Generic Constraints: 타입에도 가이드라인이 필요하다

초보자들은 제네릭을 '무엇이든 들어올 수 있는 통'으로 이해하곤 한다. 하지만 실제 라이브러리 설계에서는 **"이것만 들어와라"**라고 제약(Constraints)을 거는 것이 훨씬 중요하다.

```typescript
// [기초] 모든 타입 허용
function identity<T>(arg: T): T { return arg; }

// [전문가] 특정 모양을 가진 객체만 허용
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}
```

오픈소스 라이브러리들은 `extends` 키워드를 사용해 제네릭이 가질 수 있는 최소한의 형태를 정의한다. 이는 사용자에게 적절한 컴파일 에러를 가이드하고, 함수 내부에서 안전하게 속성에 접근할 수 있는 근거가 된다.

---

## 2. Inferred Types: 타입 시스템에 추론 맡기기

전문가들의 코드에서 가장 많이 보이는 키워드는 단연 **`infer`**다. `infer`는 조건부 타입 내에서 **"여기에 뭐가 들어올지 네가 추론해서 나한테 알려줘"**라고 컴파일러에게 부탁하는 키워드다.

`type-fest`와 같은 라이브러리에서 배열의 요소 타입을 추출할 때 사용하는 패턴을 살펴보자.

```typescript
/**
 * T가 만약 어떤 타입(E)의 배열이라면 E를 내뱉고, 
 * 아니면 never를 내뱉어라.
 */
export type ElementOf<T> = T extends Array<infer E> ? E : never;

type StringArray = string[];
type Element = ElementOf<StringArray>; // string으로 추론됨!
```

이 패턴은 단순히 타입을 지정하는 것을 넘어, 들어온 타입으로부터 새로운 정보를 **역추출**해내는 강력한 도구가 된다.

---

## 실무의 관점: React의 Props 추론

우리가 일상적으로 쓰는 React 라이브러리 내부에서도 이 기초 원리는 핵심적으로 작용한다. 컴포넌트(`ComponentType<P>`)에서 `P`(Props) 타입을 추출해낼 때도 동일한 `infer` 패턴이 사용된다.

```typescript
// index.ts
import { ElementOf } from './generics-util';

// 1. 다양한 형태의 배열에서 타입 추출
const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
type User = ElementOf<typeof users>;

const printUser = (user: User) => {
  console.log(`User ID: ${user.id}, Name: ${user.name}`);
};

// 2. 만약 배열이 아니면?
type NotAnArray = string;
type ShouldBeNever = ElementOf<NotAnArray>; // never

console.log("Types are inferred correctly!");
```

```typescript
// generics-util.ts
export type ElementOf<T> = T extends Array<infer E> ? E : never;
```

---

## 맺으며: 제약은 통제의 도구가 아닌 해방의 도구다

오픈소스 라이브러리들의 소스 코드가 외계어처럼 보였던 이유는, 그들이 `T`를 단순히 전달하는 것이 아니라 **정교하게 깎고(Constraints), 필요한 조각을 추출(Inference)**했기 때문이다. 

이 두 가지만 명확히 이해해도, 단순히 남이 만들어 놓은 타입을 쓰는 사용자를 넘어 복잡한 라이브러리의 구조를 이해하고 설계하는 제작자의 시야를 갖게 될 것이다.

> [!NOTE]
> 다음 파트에서는 이 기초를 바탕으로 런타임 스키마와 정적 타입을 완벽하게 연결하는 **Conditional Types의 심화 기법**을 다룬다.
