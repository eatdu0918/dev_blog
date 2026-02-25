---
title: "Axios 인터셉터로 구현하는 JWT Silent Refresh"
description: "sparta-msa-final-project의 코드를 통해, 토큰 만료 시 자동으로 로그인을 연장하는 스마트한 인증 관리 전략을 알아봅니다."
date: "2026-02-25"
tags: ["Frontend"]
---

# Axios 인터셉터로 구현하는 JWT Silent Refresh

사용자가 서비스를 이용하다가 갑자기 로그인 페이지로 튕겨 나간다면 어떨까요? 보안을 위해 짧은 수명의 Access Token을 쓰는 것은 좋지만, 사용자 경험(UX) 측면에서는 매우 번거로운 일입니다.

[`sparta-msa-final-project`](https://github.com/eatdu0918/sparta-msa-final-project)의 프론트엔드에서는 **Axios 인터셉터**를 활용해 토큰이 만료되어도 사용자가 인지하지 못하게 자동으로 로그인을 연장하는 **Silent Refresh**를 구현했습니다.

---

## 🛠️ 핵심 파일: `src/api/axios.ts` 분석

이  프로젝트의 `axios.ts`에는 토큰 관리의 정수가 담겨 있습니다. 크게 두 가지 인터셉터를 사용합니다.

### 1. Request Interceptor: 모든 요청에 토큰 담기
서버로 요청을 보낼 때마다 `sessionStorage`에 저장된 토큰을 가져와 `Authorization` 헤더에 자동으로 넣어줍니다.

```typescript
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});
```

### 2. Response Interceptor: 401 에러 감지 및 재발급
여기서 진짜 마법이 일어납니다. 서버가 `401 Unauthorized` 에러를 반환하면, 바로 에러를 던지는 대신 **Refresh 토큰을 이용해 새로운 Access 토큰을 요청**합니다.

```typescript
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401 에러 발생 & 아직 재시도하지 않은 요청인 경우
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // 1. Refresh API 호출
                const response = await axios.post('/api/auth/refresh', { refreshToken });
                const { accessToken } = response.data.data;

                // 2. 새 토큰 저장
                sessionStorage.setItem('accessToken', accessToken);

                // 3. 원래 실패했던 요청 재시도!
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh 마저 실패하면 로그인 페이지로 이동
                window.location.href = '/?login=true';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
```

---

## 🚀 한 걸음 더: 요청 대기 큐(Queue) 처리

만약 페이지가 로드될 때 5개의 API가 동시에 호출되었는데 토큰이 만료되었다면? 5번의 Refresh 요청이 중복으로 발생할 수 있습니다. 이를 방지하기 위해 **현재 갱신 중이라면 다른 요청들은 잠시 대기시키는 큐(Queue)** 로직을 추가했습니다.

```typescript
let isRefreshing = false;
let failedQueue: any[] = [];

// ... 인터셉터 내부 ...
if (isRefreshing) {
    // 이미 갱신 중이면 큐에 담고 대기
    return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
    }).then(token => {
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return api(originalRequest);
    });
}
```

이 로직 덕분에 중복 요청 없이 단 한 번의 토큰 갱신으로 모든 API 요청을 안전하게 성공시킬 수 있습니다.

---

## 💡 적용 시 팁

- **`sessionStorage` vs `localStorage`**: 보안 수준에 따라 선택하세요. 이 프로젝트는 브라우저 종료 시 정보가 삭제되는 `sessionStorage`를 선택했습니다. 더 높은 보안을 원한다면 `HttpOnly Cookie`를 고려해 보세요.
- **`withCredentials: true`**: 쿠키를 사용한다면 Axios 설정에 이 옵션을 잊지 마세요.

## 마무리

Axios 인터셉터를 통한 Silent Refresh는 현대 웹 서비스에서 필수적인 로직입니다. 코드 몇 줄로 사용자에게 끊김 없는 경험을 선물해 줄 수 있으니까요.

다음 포스팅에서는 이렇게 가져온 데이터를 UI에 효율적으로 뿌려주는 일등 공신, **TanStack Query(React Query)** 활용법에 대해 다뤄보겠습니다!
