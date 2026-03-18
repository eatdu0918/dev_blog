---
published: true
title: "유연성과 복잡성의 균형점: 적절한 추상화(Appropriate Abstraction) 수준 찾기"
date: '2026-03-03'
categories: ['Programming', 'CS']
---

# 유연성과 복잡성의 균형점: 적절한 추상화(Appropriate Abstraction) 수준 찾기

개발자로서 가장 어려운 질문 중 하나는 "이 코드를 얼마나 유연하게 만들어야 하는가?"입니다. 처음에는 단순히 코드를 깔끔하게 정돈하고 싶어서 무분별하게 인터페이스를 만들고 레이어를 겹겹이 쌓았습니다. 

하지만 어느 순간, 간단한 기능 하나를 수정하기 위해 5개의 파일을 돌아다녀야 하는 스스로를 보며 **추상화에도 적정 수준(Appropriate Abstraction)**이 있다는 점을 뼈아프게 깨달았습니다.

---

## 1. 오버 엔지니어링 vs 언더 엔지니어링

추상화는 양날의 검과 같습니다.

- **언더 엔지니어링 (Under-Engineering)**: 복잡한 로직을 한 곳에 뭉뚱그려 짜는 것입니다. 당장은 빠르지만 나중에는 수정하기가 불가능해지는 '스파게티 코드'가 됩니다.
- **오버 엔지니어링 (Over-Engineering)**: 나중에 필요할지도 모른다는 생각에 미리 인터페이스와 추상화 벽을 과하게 치는 것입니다. 코드만 늘어나고 이해하기 힘든 '복잡한 유령 도시'가 됩니다.

![오버/언더/적정 추상화 비교](/public/images/appropriate_abstraction_concept.png)

위 그림처럼 '커피 한 잔'을 마시기 위해 '거대한 공장 기계(Over)'를 가동할 필요는 없습니다. 하지만 '자동차'를 만드는데 '망치 하나(Under)'로 할 수도 없죠. 핵심은 **문제의 크기에 맞는 도구를 선택하는 것**입니다.

---

## 2. 실전 예제: YAGNI를 기억하라

경험했던 리팩토링 중 가장 기억에 남는 '단축키 처리' 예제입니다.

### AS-IS: 오버 엔지니어링의 숲

```typescript
// 단지 브라우저 단축키 2개를 처리하고 싶은데...
interface KeybindAction { execute(): void; }
interface KeybindHandler { handle(e: KeyboardEvent): void; }
class SaveAction implements KeybindAction { execute() { console.log('저장!'); } }
class ShortcutMgr implements KeybindHandler {
  constructor(private actions: Map<string, KeybindAction>) {}
  handle(e: KeyboardEvent) { /* 복잡한 로직... */ }
}
```

나중에 수백 개의 단축키가 추가될 것처럼 거창하게 짰지만, 사실 프로젝트 내내 단축키는 단 3개뿐이었습니다. 결과적으로 코드는 불필요하게 복잡해졌고 동료들은 "이거 하나 고치는데 왜 이렇게 파일이 많아?"라고 묻기 시작했습니다.

### TO-BE: 적절한(현실적인) 추상화

```typescript
function handleShortcuts(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 's') save();
  if (e.ctrlKey && e.key === 'p') print();
}

function save() { console.log('이미지 저장 중...'); }
function print() { console.log('프린트 출력 중...'); }
```

훨씬 명확하고 관리하기 쉽습니다. 나중에 단축키가 10개 이상 늘어나면 그때 가서 패턴을 도입해도 늦지 않습니다.

---

## 3. 깨달음과 성장: YAGNI와 DRY의 균형

적절한 추상화를 고민하며 얻은 교훈은 **"미래의 나를 믿되, 미래의 요구사항은 믿지 말라"**는 것입니다.

- **YAGNI (You Ain't Gonna Need It)**: "지금 당장 필요하지 않은 것은 미리 만들지 말자"는 원칙입니다.
- **DRY (Don't Repeat Yourself)**: "중복은 죄악이다"라는 원칙입니다.

중복을 피하려다(DRY) 오히려 불필요한 추상화(Over-Engineering)를 만들기도 합니다. 이제는 중복이 3번 이상 발생할 때 비로소 추상화를 고민하는 '삼세판 법칙'을 스스로 지키고 있습니다.

---

## 4. 회고

예전에는 복잡한 패턴과 수많은 폴더 구조가 실력 있는 개발자의 상징이라 생각했습니다. 하지만 지금은 **"문제를 해결하되 복잡성을 최소화하는 것이 진짜 실력"**임을 실감합니다. 

추상화를 할 때는 항상 "이 추상화가 주는 유연함이 지금 이 순간의 읽기 쉬운 코드보다 가치 있는가?"를 자문합니다. 코드의 기술적 화려함보다, 협업하는 동료의 인지 에너지를 아껴주는 배려가 담긴 설계를 하려 노력합니다.
