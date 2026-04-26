---
published: true
type: 'qna'
level: 'junior'
title: "CSS 박스 모델, position 속성, Flex와 Grid를 설명해 주세요"
date: '2026-04-27'
categories: ['CSS', 'Frontend']
---

## 핵심 요약

프론트엔드 신입 면접 단골. **박스 모델 + position + Flex/Grid + specificity**는 거의 무조건 나옵니다.

## 박스 모델

요소는 4겹: **content → padding → border → margin**.

기본 `box-sizing: content-box`는 width가 content만. **`border-box`**는 padding/border까지 포함 → 직관적이라 거의 항상 사용.

```css
*, *::before, *::after { box-sizing: border-box; }
```

### margin collapse
인접한 블록 요소의 세로 margin은 더해지지 않고 **큰 쪽으로 병합**. flex/grid 컨테이너 안에서는 발생 X.

## position

| 값 | 동작 |
|---|---|
| `static` (기본) | 일반 흐름 |
| `relative` | 자기 자리 기준 이동, 흐름엔 자리 유지 |
| `absolute` | 가장 가까운 positioned 조상 기준, 흐름에서 빠짐 |
| `fixed` | 뷰포트 기준 |
| `sticky` | 스크롤 따라 fixed처럼 고정 |

`absolute`의 기준은 `position: static`이 아닌 가장 가까운 조상. 보통 부모에 `position: relative`를 줘서 명시적으로 컨테이너 지정.

`sticky`는 스크롤 컨테이너 + 임계값(top/bottom) 필요. 부모 overflow가 hidden이면 작동 X.

## z-index와 stacking context

- `z-index`는 **positioned 요소**에서만 의미.
- **stacking context**가 형성되는 트리거: `position` + `z-index`(auto 외), `opacity < 1`, `transform`, `filter`, `will-change`, `isolation: isolate` 등.
- z-index가 큰데 안 올라온다면 **다른 stacking context** 안에 갇힌 경우. 부모 stacking context에 가려짐.

## Flex

1차원 레이아웃(가로 또는 세로).

```css
.container { display: flex; gap: 8px; }
```

- `flex-direction`: row(기본) / column.
- `justify-content`: 주축 정렬.
- `align-items`: 교차축 정렬.
- `flex: 1`: 남은 공간 균등 분배(`flex-grow: 1; flex-shrink: 1; flex-basis: 0`).
- `flex-wrap`: 줄바꿈.

함정: `flex-basis: auto` vs `0`. `auto`는 콘텐츠 크기 기반, `0`은 콘텐츠 무시 후 grow 비율로만.

## Grid

2차원 레이아웃.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
```

- `fr`: 남은 공간 비율.
- `repeat(auto-fit, minmax(200px, 1fr))`: 반응형 카드 그리드.
- `grid-template-areas`: 시각적으로 영역 정의.

Flex는 1차원, Grid는 2차원. 카드 리스트/페이지 레이아웃 = Grid, 컴포넌트 내부 정렬 = Flex가 일반 기준.

## CSS 우선순위 (Specificity)

높은 순:
1. `!important` (지양)
2. 인라인 스타일
3. ID 셀렉터 (#id)
4. 클래스/속성/가상클래스 (.cls, [attr], :hover)
5. 태그/가상요소 (div, ::before)
6. 보편 셀렉터 `*`

같은 specificity면 **나중에 선언된 것**이 이김. CSS Modules / styled-components가 specificity 충돌을 줄여줌.

## 단위

- `px`: 절대.
- `em`: 부모 기준 상대.
- `rem`: 루트(html) 기준 상대 — 확장성 좋음.
- `%`: 부모 크기 비율.
- `vw/vh`: 뷰포트 비율.
- `dvh`: dynamic viewport height(모바일 주소창 변동 반영).

## 자주 헷갈리는 디테일

- `display: none` vs `visibility: hidden` vs `opacity: 0`: 첫째는 흐름 제거, 둘째는 자리 유지/이벤트 차단, 셋째는 자리 유지/이벤트 받음.
- inline 요소엔 width/height/margin-top/bottom 적용 안 됨. inline-block 사용.
- `transform`은 GPU 가속 + reflow 회피 → 애니메이션은 transform/opacity 위주.

## 면접 follow-up

- "수직 가운데 정렬 방법?" → flex(`align-items: center`), grid(`place-items: center`), absolute + transform.
- "z-index가 안 먹는 이유?" → positioned가 아니거나 부모 stacking context 안에 갇힘.
- "반응형 단위 선택?" → 폰트는 rem, 컨테이너는 % 또는 fr, 뷰포트 기반은 vw/dvh.
