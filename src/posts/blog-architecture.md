---
title: 'Next.js 블로그 아키텍처 및 구현 과정'
date: '2026-02-21'
categories: ['Blog Architecture']
---

# 내 블로그는 어떻게 만들어졌나?

이 블로그는 **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**를 기반으로 만들어졌습니다. 별도의 데이터베이스 없이 **Markdown** 파일을 데이터 소스로 사용하는 파일 기반 CMS(File-based CMS) 방식을 채택했습니다.

최근에는 유지보수성을 높이고 독자에게 더 나은 경험을 제공하기 위해 **인터랙티브 요소를 강화**하는 방향으로 아키텍처를 대폭 확장했습니다.

---

## 1. 기술 스택 (Tech Stack)

*   **Framework**: Next.js 16.1 (App Router)
*   **Language**: TypeScript
*   **Markup Processing**:
    *   `remark`: Markdown을 HTML로 변환
    *   `unified` 에코시스템: 플러그인 기반 파이프라인 구축
*   **Interactive Features**:
    *   `@codesandbox/sandpack-react`: 브라우저 내 라이브 코드 실행 및 테스트 지원
    *   `mermaid`: 동적 다이어그램 렌더링

---

## 2. 확장된 아키텍처 구조 (Architecture)

단순한 텍스트 변환을 넘어, 특정 마크업을 감지하여 리액트 컴포넌트로 치환하는 **하이브리드 렌더링** 구조를 가지고 있습니다.

### 파서 계층의 진화 (`parser.ts`)

기존에는 일반적인 Markdown 변환만 수행했지만, 이제는 다음과 같은 커스텀 블록을 사전에 감지합니다.
1.  **Sandpack 블록**: `:::sandpack` 그룹을 감지하여 여러 파일의 코드와 실행 모드(Editor/Test)를 추출합니다.
2.  **Mermaid 블록**: ` ```mermaid ` 블록을 감지하여 시각화 플레이스홀더로 변환합니다.

### 렌더러 계층의 도입 (`components/`)

변환된 HTML 내부의 플레이스홀더를 실제 리액트 컴포넌트로 다시 살려내는 역할을 합니다.
*   **SandpackRenderer**: HTML 내의 데이터 속성을 읽어 `SandpackWrapper`를 호출합니다.
*   **MermaidRenderer**: `mermaid` 라이브러리를 사용하여 SVG 다이어그램을 생성합니다.

---

## 3. 학습을 위한 인터랙티브 시각화

블로그 글을 읽는 독자가 단순히 눈으로만 보는 것이 아니라, 직접 손으로 만져볼 수 있는 환경을 구축했습니다.

*   **실시간 테스트**: `SandpackTests`를 통합하여 포스팅 본문의 테스트 코드를 브라우저에서 즉시 실행하고 결과를 확인할 수 있습니다.
*   **동적 다이어그램**: Mermaid를 통해 아키텍처 변화를 텍스트 기반으로 관리하면서도 독자에게는 미려한 다이어그램으로 제공합니다.

---

## 마치며

이번 확장을 통해 "지식의 전달"뿐만 아니라 "경험의 공유"가 가능한 블로그로 한 단계 성장했습니다. 파서와 렌더러의 관심사를 엄격히 분리한 덕분에, 앞으로 더 다양한 인터랙티브 요소(예: 차트, 3D 모델 등)를 추가하는 것도 매우 수월할 것으로 기대됩니다.
