---
published: true
type: 'qna'
level: 'junior'
title: "CSS 박스 모델, position 속성, Flex와 Grid를 설명해 주세요"
date: '2026-04-27'
categories: ['CSS', 'Frontend']
---

## Q1. CSS 박스 모델을 설명해 주세요.

**A.** 모든 요소는 4겹입니다: **content → padding → border → margin**.

기본 `box-sizing: content-box`는 width를 content만으로 계산해서, padding/border가 붙으면 실제 크기가 커집니다. 그래서 거의 항상 `border-box`로 통일합니다.

```css
*, *::before, *::after { box-sizing: border-box; }
```

추가로 알아야 할 것: 인접한 블록 요소의 세로 margin은 더해지지 않고 **큰 쪽으로 병합**(margin collapse)됩니다. flex/grid 컨테이너 안에서는 발생하지 않습니다.

---

## Q2. position 값별 동작 차이를 설명해 주세요.

**A.** 5가지가 있습니다.

- `static` (기본): 일반 흐름.
- `relative`: 자기 자리 기준 이동. **흐름에는 자리 유지**.
- `absolute`: **가장 가까운 positioned 조상** 기준, 흐름에서 빠짐.
- `fixed`: 뷰포트 기준.
- `sticky`: 스크롤 따라 fixed처럼 동작. 부모 overflow가 hidden이면 작동 안 함.

`absolute`의 기준이 헷갈리는 단골 함정입니다. 부모에 `position: relative`를 명시해서 컨테이너를 분명히 지정하는 게 안전합니다.

---

## Q3. z-index가 큰데 왜 안 올라오는 경우가 있나요?

**A.** **stacking context 안에 갇힌 경우**입니다. z-index는 같은 stacking context 안에서만 비교됩니다.

stacking context를 만드는 속성:
- `position` + `z-index`(auto 외).
- `opacity < 1`.
- `transform`, `filter`, `will-change`, `isolation: isolate`.

부모가 `transform`이나 `opacity`를 가지면 자식이 z-index를 아무리 높여도 부모 stacking context의 형제 위로 못 올라갑니다. 부모를 분리하거나 portal로 빼는 게 해결책입니다.

---

## Q4. Flex와 Grid는 언제 무엇을 쓰시나요?

**A.** 차원이 다릅니다.

- **Flex**: 1차원(가로 또는 세로). 컴포넌트 내부 정렬, 네비 메뉴.
- **Grid**: 2차원. 페이지 레이아웃, 카드 리스트.

```css
.flex { display: flex; gap: 8px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
```

자주 쓰는 패턴:
- `flex: 1`: 남은 공간 균등 분배.
- `repeat(auto-fit, minmax(200px, 1fr))`: 반응형 카드 그리드.
- `place-items: center`: 가운데 정렬.

---

## Q5. CSS 우선순위(specificity) 규칙을 설명해 주세요.

**A.** 높은 순:

1. `!important` (지양).
2. 인라인 스타일.
3. ID 셀렉터(`#id`).
4. 클래스/속성/가상클래스(`.cls`, `[attr]`, `:hover`).
5. 태그/가상요소(`div`, `::before`).
6. 보편 셀렉터(`*`).

같은 specificity면 **나중에 선언된 것**이 이깁니다. CSS Modules, styled-components, Tailwind는 specificity 충돌 자체를 줄여줍니다.

---

## Q6. 수직 가운데 정렬은 어떻게 하시나요?

**A.** 방법이 여러 가지지만 모던 코드에서는 두 줄로 끝납니다.

```css
/* Flex */
.parent { display: flex; align-items: center; justify-content: center; }

/* Grid */
.parent { display: grid; place-items: center; }

/* Absolute (레거시) */
.child { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
```

absolute + transform 방식은 자식이 sizing 정보가 없을 때 유용하지만, flex/grid가 일반적입니다.

---

## Q7. `display: none`, `visibility: hidden`, `opacity: 0`은 어떻게 다른가요?

**A.** 셋 다 안 보이지만 동작이 다릅니다.

| | 자리 | 이벤트 | 접근성 |
|---|---|---|---|
| `display: none` | 제거 | 안 받음 | 트리에서 제외 |
| `visibility: hidden` | 유지 | 안 받음 | 안 읽힘 |
| `opacity: 0` | 유지 | **받음** | 읽힘 |

투명한 버튼이 클릭되는 사고는 `opacity: 0`만 쓴 경우입니다. 같이 `pointer-events: none`을 줘야 합니다.

---

## Q8. 반응형에서 단위는 어떻게 선택하시나요?

**A.** 용도별로 다릅니다.

- **폰트**: `rem` (루트 기준). 사용자 설정 폰트 크기 존중.
- **컨테이너 너비**: `%` 또는 `fr`.
- **뷰포트 기반**: `vw/vh/dvh`. 모바일 주소창 변동을 반영하려면 `dvh`.
- **여백/borders**: `rem` 또는 `px` 일관성.

`em`은 부모 기준이라 중첩 시 누적 효과가 생겨 헷갈립니다. 의도적으로 쓸 때만 사용합니다.

---

## Q9. 애니메이션 성능을 위해 어떤 속성을 쓰시나요?

**A.** **transform과 opacity**가 정석입니다. 이 두 속성은 합성(compositor) 단계에서 GPU로 처리되어 reflow/repaint를 트리거하지 않습니다.

피해야 할 것:
- `width/height/top/left` 애니메이션 → 매 프레임 reflow.
- `box-shadow`, `filter` 애니메이션 → 무거운 paint.

`will-change: transform`을 미리 선언하면 브라우저가 레이어를 준비합니다. 다만 남발하면 메모리 폭증.
