---
published: false
title: "디바운스(Debounce)와 스로틀(Throttle) 실무 적용기: 브라우저 부하 줄이기"
description: "과도한 이벤트 발생으로 인해 브라우저 렌더링 지연 및 서버 요청 과부하를 겪었던 문제를 디바운스와 스로틀 기법으로 극복한 경험을 정리합니다."
date: "2026-02-25"
tags: ["JavaScript", "Frontend", "Optimization"]
---

# 디바운스(Debounce)와 스로틀(Throttle) 실무 적용기: 브라우저 부하 줄이기

프론트엔드 최적화 작업을 진행하던 중, 검색창 자동완성과 무한 스크롤 기능을 구현하며 브라우저가 심하게 멈추는(Lag) 현상과 서버의 비정상적인 트래픽 로그를 발견한 경험이 있습니다.

원인은 사용자의 `scroll`, `input` 등 자바스크립트 이벤트 처리를 아무런 여과 장치 없이 매 순간마다 발생하도록 방치했기 때문이었습니다. 이 문제를 해결하기 위해 도입했던 이벤트 제어 기법 두 가지에 대한 회고입니다.

---

## 🛑 디바운스 (Debounce): 과호출 방지

검색어 자동완성 기능을 만들 때, 사용자가 "frontend"를 입력할 때마다 영문자 하나(f, fr, fro...) 타이핑 시점마다 API 검색 요청을 서버로 전파했습니다. 이는 무의미한 네트워크 자원 낭비와 렌더링 딜레이를 초래했습니다.

이때 **연이어 발생하는 이벤트를 그룹화하여, 입력이 잠시 멈추었을 때 단 한 번만 로직이 실행되도록 통제하는** 디바운스 기법을 활용했습니다.

### 적용 소스 (모의 구현)

```javascript
function debounce(func, delay) {
  let timeoutId;
  
  return function(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId); // 이전 요청 취소 및 시간 연장
    }
    // 새로운 타이머 시작
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// 0.5초 동안 추가 입력이 없을 때만 API 요청 실행
const searchAPI = debounce((query) => {
  console.log(`API 요청 실행: ${query}`);
}, 500);

document.getElementById('searchInput').addEventListener('input', (e) => {
  searchAPI(e.target.value);
});
```

---

## ⏱️ 스로틀 (Throttle): 일정한 실행 주기 보장

무한 스크롤 기능 등에서는 조금 달랐습니다. 사용자의 미세한 픽셀 단위 스크롤 이동마다 바닥 닿음 위치 연산이 수백 번씩 일어났습니다. 
이때는 디바운스와 달리 **일정한 주기(Time Interval)마다 한 번씩만 이벤트 콜백이 실행되도록 보장**하는 스로틀 기법을 적용했습니다.

### 적용 소스 (모의 구현)

```javascript
function throttle(func, limit) {
  let inThrottle = false;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true; // 플래그 잠금
      
      setTimeout(() => {
        inThrottle = false; // 보장된 시간이 지난 후 잠금 해제
      }, limit);
    }
  };
}

const handleScroll = throttle(() => {
  console.log("0.2초마다 한 번씩만 스크롤 연산 처리를 보장합니다.");
}, 200);

window.addEventListener('scroll', handleScroll);
```

---

## 💡 요약 및 회고

| 패턴                    | 동작 원리                                                                  | 주요 적용 사례                                 |
| :---------------------- | :------------------------------------------------------------------------- | :--------------------------------------------- |
| **디바운스 (Debounce)** | 연이은 이벤트 후 최종적으로 **대기 시간이 끝날 때 한 번** 실행             | 검색어 자동완성 입력, 중복 제출 버튼 클릭 방지 |
| **스로틀 (Throttle)**   | 연속된 이벤트라도 설정 시간 내 **일정한 주기마다 규칙적으로** 한 번씩 실행 | 무한 스크롤 트리거 계산, 화면 리사이징 연산    |

기능 위주로 돌아가기만 하면 된다는 안일한 접근 방식이, 사용자 애플리케이션의 성능을 심각하게 잡아먹고 서버 트래픽 비용을 발생시킨다는 것을 체감하게 되었습니다. 

실무에서는 보통 검증된 유틸리티인 `lodash`의 메서드(`_.debounce()`, `_.throttle()`)를 직접 끌어다 쓰게 되지만, 이 두 가지 이벤트 제어 메커니즘이 근본적으로 어떻게 클라이언트와 서버의 자원 부하를 막아주는지를 로직 단위에서 이해할 수 있었던 소중한 트러블슈팅 경험이었습니다.
