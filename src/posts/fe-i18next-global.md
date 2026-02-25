---
title: "글로벌 서비스의 지름길: i18next로 React 다국어 완벽 지원하기"
description: "sparta-msa-final-project에서 선택한 다국어(i18n) 전략과 효율적인 번역 관리 팁을 공개합니다."
date: "2026-02-25"
tags: ["Frontend"]
---

# 글로벌 서비스의 지름길: i18next로 React 다국어 완벽 지원하기

스타트업이나 글로벌 서비스를 지향하는 프로젝트라면 반드시 고려해야 할 것이 있습니다. 바로 **다국어(i18n)** 지원입니다. 텍스트를 컴포넌트에 하드코딩해 두었다면 나중에 영어나 일본어를 추가할 때 모든 파일을 뒤져야 하는 수고가 따릅니다.

[`sparta-msa-final-project`](https://github.com/eatdu0918/sparta-msa-final-project)에서는 업계 표준 라이브러리인 **i18next**를 활용해 유지보수가 쉬운 글로벌 서비스 기반을 닦았습니다.

---

## 🛠️ 설정하기: `src/i18n.ts`

먼저 라이브러리를 초기화하고, 언어별 번역 파일(JSON)을 연결해 주어야 합니다.

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 번역 데이터 로딩 (보통 별도의 JSON 파일로 관리)
import ko from './locales/ko.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector) // 브라우저 언어를 자동으로 감지
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
    },
    fallbackLng: 'ko', // 인식 실패 시 기본 언어
    interpolation: { escapeValue: false }
  });

export default i18n;
```

### 번역 파일 구조 (locales/ko.json)
```json
{
  "header": {
    "login": "로그인",
    "search": "상품 검색"
  },
  "cart": {
    "add_success": "{{name}} 상품이 담겼습니다!"
  }
}
```

---

## 🏗️ 컴포넌트에서 사용하기: `useTranslation`

이제 더 이상 컴포넌트에 "로그인"이라고 적지 않습니다. 대신 키(Key) 값을 사용합니다.

```tsx
import { useTranslation } from 'react-i18next';

function Header() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng); // 클릭 한 번으로 서비스 전체 언어 변경!
  };

  return (
    <header>
      <h1>{t('header.search')}</h1>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('ko')}>한국어</button>
    </header>
  );
}
```

---

## ✨ i18next의 숨은 강점: 동적 인자(Interpolation)

단순히 글자만 바꾸는 게 아닙니다. 변하는 값(상품명, 가격 등)을 번역문에 자연스럽게 녹일 수 있습니다.

- **JSON**: `"total": "총 {{count}}개의 상품이 있습니다."`
- **React**: `t('total', { count: cartItems.length })` -> "총 5개의 상품이 있습니다."

---

## 💡 실천 포인트: 번역 관리 팁

1.  **키 명명 규칙**: `도메인.기능.위치` (예: `order.form.button_submit`) 등으로 명확히 정하면 중복을 피할 수 있습니다.
2.  **번역 파일 분리**: 앱이 커지면 하나의 JSON이 너무 비대해집니다. 도메인별로 파일을 쪼개고 `ns`(Namespace) 기능을 활용하세요.
3.  **검수 프로세스**: 기획자나 번역가와 소통할 때, JSON 파일을 공유하기보다는 구글 스프레드시트를 이용해 관리하고 JSON으로 변환하는 자동화 스크립트를 추천드립니다.

## 마무리

다국어 지원은 단순히 '언어를 바꾸는 것' 이상의 가치가 있습니다. 코드에서 텍스트를 분리함으로써 개발자와 기획자가 더 효율적으로 협업할 수 있는 구조를 만들어줍니다.

다음 포스팅에서는 이커머스의 정점! **PortOne SDK**를 활용한 실제 결제 연동 가이드로 돌아오겠습니다.
