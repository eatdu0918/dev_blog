---
title: '왜 Next.js를 도입해야 할까?'
date: '2026-02-21'
categories: ['Programming', 'Next.js', 'React']
---

# React로 충분한데 왜 Next.js를 도입해야 할까?

React 마스터가 되겠다며 열심히 공부하던 중, 채용 공고나 기술 블로그를 보면 꼭 'Next.js 경험'을 우대하거나 필수로 요구하는 것을 보게 되었습니다. "React만 잘해도 충분하지 않을까?"라는 의문이 들어 여러 자료를 찾아보고 직접 찍먹해보며 내가 이해한 Next.js의 필요성과 핵심 개념들을 정리해 봅니다.

---

## 1. 내가 느낀 렌더링 방식의 차이점 (CSR vs SSR)

React 단독으로 개발한 앱(CRA, Vite 등)을 배포해 보니, 처음에 흰 화면이 잠깐 보인 뒤에야 내용이 짜잔 하고 나타나는 현상이 있었습니다. 알고 보니 이 방식이 **CSR (Client-Side Rendering)** 이었습니다. 
- HTML 껍데기만 먼저 받고, 무거운 자바스크립트 파일을 전부 다운로드하고 실행해야 화면이 그려지는 방식입니다.
- 이 때문에 초기 로딩(FCP)이 느리고, 구글 같은 검색엔진 봇이 내용이 없는 껍데기만 읽고 가서 SEO(검색엔진 최적화)에 불리하다는 큰 단점이 있었습니다.

반면, Next.js는 기본적으로 **서버(Server)** 에서 미리 완성된 HTML을 만들어서 브라우저에 내려주는 빙식을 사용합니다.
- **SSR (Server-Side Rendering)**: 요청이 올 때마다 서버에서 최신 데이터가 담긴 완전한 HTML을 렌더링해서 보냅니다.
- **SSG (Static Site Generation)**: 아예 빌드할 때 HTML을 만들어두고 엄청나게 빠르게 응답합니다.

사용자는 자바스크립트 다운로드를 기다릴 필요 없이 즉시 화면을 볼 수 있고, 검색 크롤러도 내용을 완벽하게 읽어갈 수 있다는 점이 가장 큰 매력으로 다가왔습니다.

![CSR과 SSR 비교](/images/nextjs_rendering_flow.png)

---

## 2. App Router와 서버/클라이언트 컴포넌트 찍먹해보기

Next.js 13 버전부터 'App Router'라는 새로운 폴더 구조가 도입되었다고 합니다. 가장 헷갈리면서도 신기했던 점은, **이제 모든 컴포넌트가 기본적으로 '서버 컴포넌트(RSC)'로 동작한다**는 것이었습니다. 브라우저 이벤트나 상태값이 필요한 요소만 골라서 '클라이언트 컴포넌트'로 선언(`"use client"`)해야 합니다.

실제로 코드를 어떻게 나누어야 할지 고민하며 작성해 본 예시입니다.

```tsx
// app/page.tsx (서버 컴포넌트)
// 브라우저로 코드가 넘어가지 않기 때문에 보안이 중요한 로직이나 무거운 작업을 넣기 좋습니다.
import InteractiveButton from '@/components/InteractiveButton';

export default async function HomePage() {
  // 별도의 useEffect 없이 함수 컴포넌트 자체가 async/await로 서버 데이터를 가져옵니다.
  const userData = await fetch('https://api.example.com/user').then((res) => res.json());

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">환영합니다, {userData.name}님!</h1>
      <p className="mt-4">이 부분은 서버에서 HTML로 다 그려져서 내려옵니다.</p>
      
      {/* 상태 변화가 필요한 버튼만 클라이언트 컴포넌트로 분리해서 가져옵니다. */}
      <InteractiveButton title="더 알아보기" />
    </main>
  );
}
```

```tsx
// components/InteractiveButton.tsx (클라이언트 컴포넌트)
'use client'; // 이 선언이 없으면 브라우저 API(onClick 등)를 쓸 때 에러가 납니다.

import { useState } from 'react';

export default function InteractiveButton({ title }: { title: string }) {
  const [clicked, setClicked] = useState(false);

  return (
    <button 
      className={`px-4 py-2 mt-4 rounded text-white ${clicked ? 'bg-gray-500' : 'bg-blue-600'}`}
      onClick={() => setClicked(true)}
    >
      {clicked ? '클릭되었습니다!' : title}
    </button>
  );
}
```

**💡 내가 이해한 포인트:**
처음에는 `app/page.tsx`에 바로 `onClick`을 넣었는데 에러가 났습니다. 서버 컴포넌트는 서버에서 렌더링 되고 끝이기 때문에 브라우저의 이벤트(클릭 등)를 처리할 수 없기 때문이었습니다. 즉, 화면을 구성하는 큰 틀(데이터 패칭 등)은 **서버 컴포넌트**에 맡기고, 사용자와 상호작용해야 하는 작은 버튼, 입력 폼 등만 **클라이언트 컴포넌트**로 쪼개는 것이 App Router 설계의 핵심이었습니다.

---

## 3. 실질적인 컴포넌트 렌더링 테스트 해보기 

블로그를 보고 그대로 따라 치더라도 동작을 확신할 수 있는 테스트가 필요하다고 느껴서, 아주 단순하고 누구나 바로 에디터에서 실행 가능한 단위 테스트 코드를 작성해봤습니다. 복잡한 세팅 없이 환경(예: Jest나 Vitest) 내에서 위 클라이언트 컴포넌트의 동작을 검증하는 방법입니다.

::sandpack-start(App.tsx)
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// 버튼 컴포넌트
function InteractiveButton({ title }: { title: string }) {
  const [clicked, setClicked] = useState(false);

  return (
    <button 
      style={{ padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', backgroundColor: clicked ? '#6b7280' : '#2563eb', color: 'white', border: 'none' }}
      onClick={() => setClicked(true)}
    >
      {clicked ? '클릭되었습니다!' : title}
    </button>
  );
}

// 동작 확인 (시각적으로 렌더링)
export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h3>직접 클릭하고 코드를 수정해 보세요!</h3>
      <InteractiveButton title="더 알아보기" />
    </div>
  );
}
::sandpack-end

위 에디터 화면 안에서 직접 버튼을 클릭해보고 코드를 수정해볼 수 있습니다! 코드를 편집하면 오른쪽 화면에 실시간으로 반영됩니다. 독립적인 클라이언트 컴포넌트를 테스트하기가 훨씬 직관적입니다!

---

## 4. 학습하며 마주한 의문과 고민 (한계점)

이론상으로는 서버에서 다 그려주니 너무 좋지만, 막상 구현해보려니 당장 머릿속에 혼란이 생겼습니다.
1. "기존에는 최상단에서 Context API로 상태를 내려줬는데, 서버 컴포넌트에서는 Context API를 쓰지 못한다면 전역 상태 관리는 어떻게 해야 하지?"
2. Vercel 없이 AWS EC2나 다른 클라우드에 Next.js를 올렸을 때도 성능 최적화가 동일하게 잘 될 지 걱정이 되었습니다.
3. 무조건 SSR이 좋은 건 아니라는 말을 들었는데, 오히려 인터랙션이 극도로 많은 대시보드 같은 서비스라면 CSR 방식인 Vite + React 조합이 낫지 않을까 하는 생각이 들었습니다. 도입 전 서비스의 성격을 정확히 파악하는 안목도 중요할 것 같습니다.

## 5. 다음 학습 목표

Next.js의 기본적인 렌더링 방식과 서버 컴포넌트에 대해 감을 잡았으니, 다음 단계로는 아래 내용들을 더 깊이 파보려고 합니다.
- **React Query + Next.js 조합**: 서버 컴포넌트에서 초기 데이터를 가져오고, 클라이언트에서 다시 데이터를 무효화(invalidate)하거나 갱신할 때 어떻게 연동하는지 학습하기.
- **Server Actions**: Next.js 14부터 강력해진 기능이라는데, 컴포넌트 내부에서 바로 DB에 접근해 데이터를 변경하는 폼(Form) 처리를 직접 구현해 보기.

---
