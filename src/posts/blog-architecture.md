---
title: 'Next.js 블로그 아키텍처 및 구현 과정'
date: '2026-02-20'
categories: ['Blog Architecture']
---

# 내 블로그는 어떻게 만들어졌나?

이 블로그는 **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**를 기반으로 만들어졌습니다. 별도의 데이터베이스 없이 **Markdown** 파일을 데이터 소스로 사용하는 파일 기반 CMS(File-based CMS) 방식을 채택했습니다.

최근에는 유지보수성을 높이기 위해 **관심사 분리(Separation of Concerns)** 원칙을 적용하여 내부 구조를 대폭 리팩토링했습니다.

---

## 1. 기술 스택 (Tech Stack)

*   **Framework**: Next.js 16.1 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS 4
*   **Markup Processing**:
    *   `remark`: Markdown을 HTML로 변환
    *   `gray-matter`: Markdown 파일의 메타데이터(Frontmatter) 파싱

---

## 2. 아키텍처 구조 (Architecture)

초기에는 모든 로직이 하나의 파일(`lib/posts.ts`)에 뭉쳐 있었지만, 확장성을 위해 다음과 같이 계층을 분리했습니다.

### 폴더 구조

```
src/lib/posts/
├── types.ts       # 데이터 인터페이스 정의 (PostMetadata, PostContent)
├── repository.ts  # 파일 시스템 접근 (fs.readdir, fs.readFileSync)
├── parser.ts      # 데이터 가공 (Markdown -> HTML 변환)
└── service.ts     # 비즈니스 로직 (정렬, 필터링, 데이터 통합)
```

### 각 계층의 역할

1.  **Repository Layer (`repository.ts`)**
    *   오직 파일 시스템(`fs`)과 상호작용합니다.
    *   파일 목록을 가져오거나 파일을 읽는 원자적인 작업만 수행합니다.

2.  **Parser Layer (`parser.ts`)**
    *   Raw 포맷(String)을 애플리케이션에서 사용할 수 있는 객체로 변환합니다.
    *   `gray-matter`로 메타데이터와 본문을 분리하고, `remark`로 HTML 변환을 수행합니다.

3.  **Service Layer (`service.ts`)**
    *   Repository와 Parser를 조합하여 애플리케이션에 필요한 데이터를 제공합니다.
    *   `getAllPosts(category?)`: 필터링 및 정렬 로직이 포함되어 있습니다.
    *   `getAllCategories()`: 전체 게시물에서 카테고리 목록을 추출합니다.

---

## 3. 기능 구현: 카테고리 필터링

블로그 글이 많아질 것을 대비해 사이드바를 통한 카테고리 필터링 기능을 추가했습니다.

*   **데이터**: 각 Markdown 파일 상단에 `categories: ['TagName']` 형태로 메타데이터를 추가했습니다.
*   **UI**: `Sidebar` 컴포넌트에서 전체 카테고리 목록을 보여줍니다.
*   **로직**: URL Query Parameter(`/?category=...`)를 사용하여 서버 사이드에서 필터링된 게시물 목록을 렌더링합니다.

---

## 마치며

이번 리팩토링을 통해 **"데이터를 가져오는 방법"**과 **"데이터를 사용하는 방법"**을 명확히 분리할 수 있었습니다. 덕분에 추후에 Markdown 대신 CMS(예: Notion, Contentful)로 데이터 소스를 변경하더라도, Service 계층 이하만 수정하면 되므로 유연한 대처가 가능해졌습니다.
