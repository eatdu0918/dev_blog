---
title: "Axios 인터셉터 도입기: JWT Silent Refresh 구현 경험"
description: "토큰 만료로 인한 사용자 불편을 해결하기 위해 Axios 인터셉터와 Silent Refresh를 알게 되고 적용한 과정을 기록합니다."
date: "2026-02-25"
tags: ["Frontend", "React", "Axios"]
---

# Axios 인터셉터 도입기: JWT Silent Refresh 구현 경험

웹 서비스에서 보안을 위해 수명이 짧은 Access Token을 도입했을 때, 사용자가 서비스를 이용하다가 갑자기 로그아웃 처리되어 버리는 UX(사용자 경험) 저하 문제를 겪은 적이 있습니다. 

이를 해결하기 위해 클라이언트 코드 모든 곳에 토큰 만료 처리 로직을 넣으려다 코드가 엉망이 되었고, 최종적으로 **Axios 인터셉터(Interceptor)**를 활용한 **Silent Refresh** 방식을 도입하여 문제를 해결한 경험을 회고해 봅니다.

---

## 🛠️ 모든 요청에 토큰 관리 로직 중복

초기 코드에서는 API를 호출할 때마다 헤더에 토큰을 직접 꺼내서 넣고, 401 에러가 반환되는지 매번 `try-catch`로 감싸서 확인했습니다. 

```typescript
// 초기 비효율적인 방식
async function getUser() {
    try {
        const token = sessionStorage.getItem('accessToken');
        const res = await axios.get('/api/user', { headers: { Authorization: `Bearer ${token}` } });
        return res.data;
    } catch (error) {
        if (error.response?.status === 401) {
            // 토큰 재갱신 API 따로 호출 후 재요청... (코드 중복)
        }
    }
}
```

이 방식은 수십 개의 API 함수에 똑같은 로직을 강제하게 만들어 유지보수를 극도로 어렵게 만들었습니다. 

---

## 🔒 인터셉터를 통한 중앙 집중화

중복 코드를 걷어내기 위해 `axios` 인스턴스에 인터셉터를 설정했습니다. 요청(Request)을 보내기 직전과, 응답(Response)을 받기 직전에 가로채어 공통 작업을 처리할 수 있는 강력한 기능이었습니다.

### 1. Request Interceptor: 토큰 주입
```typescript
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`; // 헤더 세팅을 한 곳으로 규합
    }
    return config;
});
```

### 2. Response Interceptor: 401 에러 감지 및 재시도 로직
서버가 `401 Unauthorized` 에러를 반환했을 때, 바로 에러를 터뜨리지 않고 Refresh Token을 이용해 조용히(Silent) 새 Access Token을 발급받은 뒤, **실패했던 원래의 요청을 다시 보내도록** 구현했습니다.

```typescript
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // 무한 루프 방지
            
            try {
                const response = await axios.post('/api/auth/refresh', { refreshToken });
                const { accessToken } = response.data.data;
                sessionStorage.setItem('accessToken', accessToken);

                // 발급받은 새 토큰으로 기존 요청 재시도
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh마저 만료된 경우 최종 로그아웃 처리
                window.location.href = '/?login=true';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
```

---

## 🚀 비동기 큐(Queue)를 통한 동시성 제어

기본적인 Silent Refresh를 구현한 뒤 새로운 문제를 직면했습니다. 페이지 랜딩 시 여러 API가 동시에 호출되는데, 토큰이 만료된 상태라면 재발급(Refresh) 요청이 중복으로 발생할 수 있는 동시성 이슈였습니다.

이를 해결하기 위해, 갱신이 진행 중일 때는 추가적인 갱신 요청을 막고 다른 API 요청들을 임시 배열(Queue)에 대기시켰습니다. 새 토큰 발급이 완료되면 큐에 대기 중이던 요청들에게 일괄적으로 새 토큰을 주입하여 재실행시키는 로직을 추가하여 리소스 낭비를 막았습니다. 

## 회고

단순히 기능이 동작하는 수준을 넘어, 사용자 경험(UX)을 지키면서도 전체 시스템의 네트워크 중복 호출이나 관리 포인트를 줄이는 아키텍처적 관점의 설계 고민을 할 수 있었던 뜻깊은 경험이었습니다.
