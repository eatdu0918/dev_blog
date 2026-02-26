---
title: "DRY 원칙: 코드 중복을 피하기 (Don't Repeat Yourself)"
description: "DRY 원칙의 중요성과, 무리한 추상화로 인해 겪었던 부작용에 대한 실무 경험을 정리합니다."
date: "2026-02-26"
tags: ["Architecture"]
---

# DRY 원칙: 코드 중복을 피하기 (Don't Repeat Yourself)

코드 품질을 이야기할 때 항상 언급되는 원칙 중 하나가 **DRY 원칙(Don't Repeat Yourself)**입니다. 동일한 지식이나 로직을 시스템 내에서 유일하게 표현해야 한다는 설계 원칙입니다.

초기 프로젝트들을 진행하면서 가장 빈번하게 저질렀던 실수이자, 리팩토링의 핵심이 되었던 경험을 바탕으로 이 원칙의 중요성과 주의점을 적어봅니다.

---

## 🚫 복사 및 붙여넣기로 인한 문제 상황

과거 프로젝트에서 API 통신 로직을 작성할 때의 일입니다. 로그인 유저, 가입 유저, 탈퇴 유저 목록을 조회하는 기능이 각각 필요했습니다. 빠른 구현을 목적으로 첫 번째 함수를 작성한 뒤, 이를 복사하여 API 엔드포인트 문자열만 조금씩 수정해 세 가지 함수를 뚝딱 만들어냈습니다.

```javascript
// 중복이 존재하는 방치된 코드 예시
function fetchLoginUsers() {
    const url = '/api/users/login';
    // 응답 처리, 에러 핸들링, 로딩 상태 변경 등 다수의 중복 코드
    return fetch(url).then(res => res.json());
}

function fetchSignupUsers() {
    const url = '/api/users/signup';
    // fetchLoginUsers와 동일한 처리 로직
    return fetch(url).then(res => res.json());
}

function fetchDeletedUsers() {
    const url = '/api/users/deleted';
    // 또 동일한 처리 로직
    return fetch(url).then(res => res.json());
}
```

초기에는 제대로 동작하는 것처럼 보였습니다. 그러나 몇 주 뒤, 백엔드 응답 규격이 변경되어 프론트엔드의 파싱 로직을 수정해야 하는 상황이 발생했습니다. 

급한 마음에 `fetchLoginUsers`와 `fetchSignupUsers` 두 함수만 수정하고, 구석에 있던 `fetchDeletedUsers` 함수를 미처 수정하지 못해 프로덕션에서 버그가 발생했습니다. 코드의 파편화가 유지보수 누락으로 이어진 것입니다.

---

## ✅ DRY 원칙 적용과 단일 진실 공급원

버그를 수정한 뒤, 코드를 DRY 원칙에 맞게 리팩토링했습니다. 공통으로 사용되는 로직을 하나로 묶어 추상화했습니다.

```javascript
// 추상화된 공통 모듈
async function fetchUsersByStatus(status) {
    const url = `/api/users/${status}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API 응답 예외 처리');
        return await response.json();
    } catch (error) {
        console.error(`사용자 조회 중 에러 발생:`, error);
        throw error;
    }
}

// 기존 함수들은 단일화된 모듈을 호출하도록 수정
function getLoginUsers() { return fetchUsersByStatus('login'); }
function getSignupUsers() { return fetchUsersByStatus('signup'); }
function getDeletedUsers() { return fetchUsersByStatus('deleted'); }
```

이렇게 리팩토링하고 나니, 이후 에러 핸들링 로직을 추가하거나 로딩 상태를 관리할 때 `fetchUsersByStatus`라는 단 한 곳의 코드만 수정하면 되어 유지보수의 안정성이 눈에 띄게 높아진 것을 확인했습니다.

---

## ⚠️ 회고: 성급한 추상화의 늪

하지만 무조건 똑같이 생긴 코드를 모두 묶는 것이 정답은 아니라는 것을 또 다른 배포에서 깨달았습니다.

한 번은 '비밀번호 변경 템플릿'과 '주문 완료 템플릿'을 렌더링하는 코드가 우연히 90% 이상 일치하는 것을 보고, 이를 하나의 컴포넌트로 강제로 합쳐버렸습니다. 처음에는 코드가 줄어서 좋았지만, 이후 기획 측에서 '주문 완료' 시에만 쿠폰 이미지를 띄워달라는 요구사항이 들어왔습니다.

결국 단일 컴포넌트 내부에 `if (isOrder) { ... } else { ... }` 분기를 추가하게 되었고, 나중에는 두 비즈니스 로직이 완전히 달라지면서 코드가 더 난해해지는 상황을 겪어야 했습니다. 단지 우연히 코드 형태가 비슷했을 뿐, 변경되는 이유(라이프사이클)는 달랐던 것입니다.

초기 구현에서는 성급하게 추상화하기보다 우연한 중복으로 남겨두고, 똑같은 변경이 세 군데 이상 주기적으로 발생할 때(Rule of Three) 리팩토링을 시작하는 접근이 실무에서는 더 실용적일 수 있음을 깨달았습니다.
