---
published: true
title: '클라이언트 컴포넌트와 서버 컴포넌트의 조화: 댓글 UI 통합'
date: '2026-03-04'
categories: ['Next.js', 'React']
---

# 클라이언트 컴포넌트와 서버 컴포넌트의 조화: 댓글 UI 통합

Next.js 13 이상에서 도입된 **App Router** 환경에서는, 컴포넌트가 서버에서 렌더링될지(Server Component) 브라우저에서 실행될지(Client Component)를 결정하는 것이 매우 중요합니다. 이번에는 정적인 블로그 포스트 페이지에 동적인 댓글 기능을 어떻게 효율적으로 통합했는지 그 구조를 살펴봅니다.

---

## 1. 컴포넌트 역할 분담

댓글 시스템은 다음과 같이 두 종류의 컴포넌트로 나뉩니다:

- **Server Components (정적/데이터 로드)**: 블로그 포스트 본문, 기존 댓글 목록. 서버에서 직접 DB를 조회하여 클라이언트로 전달하므로 성능이 빠르고 SEO에 유리합니다.
- **Client Components (상호작용)**: 댓글 입력 폼, '등록' 버튼, 입력값 상태 관리. 사용자 입력을 처리하고 즉각적인 피드백을 주어야 하므로 클라이언트 측 자바스크립트가 필요합니다.

## 2. 실제 구현 구조

### Server Component: 댓글 섹션 (부모)
데이터베이스에서 댓글 목록을 가져와 자식 컴포넌트들에게 전달하거나 직접 렌더링합니다.

```tsx
// src/app/posts/[slug]/page.tsx
import CommentForm from '@/components/comments/CommentForm';
import CommentList from '@/components/comments/CommentList';
import { getComments } from '@/lib/comments';

export default async function PostPage({ params }: { params: { slug: string } }) {
  const comments = await getComments(params.slug);

  return (
    <article>
      {/* 포스트 본문 */}
      <section id="comments">
        <h2>댓글 ({comments.length})</h2>
        <CommentForm slug={params.slug} />
        <CommentList comments={comments} />
      </section>
    </article>
  );
}
```

### Client Component: 댓글 폼 (자식)
사용자의 입력을 받고 Server Action을 호출합니다.

```tsx
// src/components/comments/CommentForm.tsx
'use client';

import { submitComment } from '@/app/actions/comments';

export default function CommentForm({ slug }: { slug: string }) {
  // useState를 이용한 입력값 관리 및 onSubmit 핸들러
  return <form>{/* 입력창 및 제출 버튼 */}</form>;
}
```

## 3. 조화로운 통합의 핵심: `revalidatePath`

Client Component인 `CommentForm`에서 댓글을 성공적으로 등록한 뒤, 어떻게 Server Component인 `CommentList`가 새 데이터를 즉시 보여줄 수 있을까요?

핵심은 Server Action 내부에서 호출하는 **`revalidatePath`**에 있습니다.

```typescript
// src/app/actions/comments.ts (Server Action)
export async function submitComment(formData: FormData) {
  // ... DB 저장 로직 ...
  
  // 현재 페이지의 캐시를 즉시 무효화하고 최신 데이터를 다시 로드하도록 지시
  revalidatePath(`/posts/${slug}`);
  return { success: true };
}
```

이 방식 덕분에 복잡한 상태 관리 라이브러리(Redux 등)나 별도의 API 호출 없이도, 마치 SPA처럼 매끄럽게 UI가 갱신됩니다.

---

## 마치며

서버와 클라이언트의 경계를 이해하고 각자의 장점을 활용하면, 사용자에게는 빠르고 반응성 좋은 UI를, 개발자에게는 유지보수하기 쉬운 구조를 제공할 수 있습니다. 여러분의 프로젝트에도 이 '조화'를 적용해 보세요!
