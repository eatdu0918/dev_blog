---
published: true
title: 'Next.js 14+ Server Actions와 Prisma로 만드는 댓글 시스템'
date: '2026-03-04'
categories: ['Next.js']
---

# Next.js 14+ Server Actions와 Prisma로 만드는 댓글 시스템

최근 블로그에 댓글 기능을 추가하면서, 별도의 API 엔드포인트를 만들지 않고 **Next.js의 Server Actions**와 **Prisma ORM**만을 활용해 구현해 보았습니다. 백엔드와 프론트엔드의 경계가 허물어지는 이 방식은 개발 생산성을 비약적으로 높여주었습니다.

---

## 1. 데이터 모델 설계 (Prisma)

먼저 댓글 정보를 저장할 데이터베이스 모델을 정의합니다. `slug`를 통해 특정 포스트와 연결하며, 익명 사용자를 위해 `nickname`과 `ip` 필드를 포함했습니다.

```prisma
// prisma/schema.prisma
model Comment {
  id        String   @id @default(cuid())
  slug      String
  nickname  String   @default("익명")
  content   String   @db.Text
  ip        String?
  createdAt DateTime @default(now())

  @@index([slug])
}
```

## 2. Server Actions 구현

Next.js의 Server Actions를 사용하면 브라우저에서 서버 함수를 직접 호출할 수 있습니다. 폼 데이터를 처리하고 데이터베이스에 저장한 뒤, 페이지를 신선하게(Fresh) 유지하기 위해 `revalidatePath`를 호출합니다.

```typescript
// src/app/actions/comments.ts
'use server';

import { addComment } from '@/lib/comments';
import { revalidatePath } from 'next/cache';

export async function submitComment(formData: FormData) {
  const slug = formData.get('slug') as string;
  const nickname = (formData.get('nickname') as string) || '익명';
  const content = formData.get('content') as string;

  if (!slug || !content) {
    return { error: '필수 항목이 누락되었습니다.' };
  }

  await addComment({
    slug,
    nickname,
    content,
    // (IP 추출 로직 생략)
  });

  // 해당 포스트 페이지의 캐시를 무효화하여 새 댓글이 즉시 보이게 함
  revalidatePath(`/posts/${slug}`);
  return { success: true };
}
```

## 3. UI에서 활용하기

작성한 Server Action은 클라이언트 컴포넌트의 폼에서 아주 간단하게 연결됩니다.

```tsx
// src/components/comments/CommentForm.tsx
'use client';

import { submitComment } from '@/app/actions/comments';

export default function CommentForm({ slug }: { slug: string }) {
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const result = await submitComment(formData);
    
    if (result.success) {
      // 성공 처리 (입력창 비우기 등)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 닉네임, 내용 입력창 및 제출 버튼 */}
    </form>
  );
}
```

---

## 마치며

Server Actions를 사용하면 `fetch` API나 상태 코드 처리에 쏟는 시간을 줄이고, 비즈니스 로직에 더 집중할 수 있습니다. 특히 Prisma와의 조합은 타입 안정성까지 보장해주어 매우 강력했습니다. 여러분도 복잡한 API 레이어 대신 Server Actions를 고려해 보세요!
