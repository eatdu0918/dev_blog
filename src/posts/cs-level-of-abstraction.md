---
published: true
title: '추상화 수준: 코드의 가독성과 유지보수 사이의 균형'
date: '2026-03-03'
categories: ['Programming', 'CS']
---

# 추상화 수준: 코드의 가독성과 유지보수 사이의 균형

처음 코드를 작성할 때는 하나의 함수 안에 모든 것을 쏟아붓곤 했습니다. 데이터베이스의 쿼리를 짜고, 비즈니스 로직을 검증하고, 브라우저의 DOM을 조작하는 코드가 한 곳에 뒤섞여 있었죠.

동작만 하면 장땡이라고 생각했지만, 시간이 흘러 코드를 다시 들여다볼 때마다 한참을 고민해야 했습니다. "이 함수는 그래서 **무엇**을 하려는 걸까?"라는 근본적인 질문에 대한 답을 찾는 데 너무 많은 에너지를 쏟고 있었던 것입니다. 이것이 제가 **추상화 수준(Level of Abstraction)**을 깊이 고민하게 된 시작점이었습니다.

---

## 1. 하이레벨(What)과 로우레벨(How)의 구분

추상화 수준을 이해하려면 먼저 두 관점을 구별해야 합니다.

- **하이레벨 (High-Level)**: 무엇(What)을 할 것인가에 집중합니다. 비즈니스 로직이나 프로그램의 전체적인 흐름이 이에 해당합니다.
- **로우레벨 (Low-Level)**: 어떻게(How) 할 것인가에 집중합니다. 구체적인 통신 방식, 데이터 처리 알고리즘, 세부 연산 등이 이에 해당합니다.

좋은 코드는 각 함수나 클래스가 **단일 추상화 수준(SLAP, Single Level of Abstraction Principle)**을 유지해야 합니다. 비즈니스 로직을 다루는 함수는 비즈니스 로직만 다루고, 세부 구현은 다른 함수에 위임해야 가독성이 극대화됩니다.

![추상화 수준의 계층 구조](/images/level_of_abstraction_concept.png)

위 그림처럼 '주문 처리'라는 추상적인 목표(High Level) 아래에 'DB 조회', 'JSON 파싱', 'HTTP 요청'과 같은 구체적인 기술(Low Level)이 레이어처럼 쌓여 있어야 합니다.

---

## 2. 실전 예제: 뒤섞인 코드에서 추상화된 코드로

과거의 제 모습을 담은 주문 처리 예제입니다.

### AS-IS: 추상화 수준이 뒤섞인 코드 (Mixed Levels)

```typescript
async function processOrder(orderId: string) {
  // 로우레벨: 쿼리 직접 작성 (How)
  const connection = await db.connect();
  const order = await connection.query(`SELECT * FROM orders WHERE id = ${orderId}`);

  // 하이레벨: 비즈니스 정책 (What)
  if (order.price > 1000000) {
    console.log('VVIP 사은품 지급 대상입니다.');
  }

  // 로우레벨: 원시적인 API 연동 (How)
  await axios.post('https://api.notifier.com/sms', {
    to: order.userPhone,
    msg: `주문(${orderId})이 접수되었습니다.`
  });
}
```

이 함수는 `"주문을 처리한다"`라는 큰 주제를 다루면서도 DB 접속, 원시 쿼리, HTTP 호출 규격을 직접 건드리고 있습니다. 코드의 농도(Density)가 너무 높아서 핵심 로직이 한눈에 들어오지 않습니다.

### TO-BE: 추상화 수준을 분리한 코드 (Leveled)

```typescript
async function processOrder(orderId: string) {
  const order = await findOrderById(orderId); // 무엇: 주문을 찾는다
  checkVipBenefit(order);                    // 무엇: VIP 혜택 확인
  await notifyOrder(order);                  // 무엇: 알림 발송
}

// 구체적인 구현(How)은 하위 수준의 함수로 숨깁니다.
async function findOrderById(id: string) {
  return await db.orders.findOne(id); // 데이터 접근 기술 은닉
}

function checkVipBenefit(order: any) {
  if (order.price > 1000000) applyGift(order); // 정책 로직 집중
}

// ... notifyOrder, applyGift 등의 구현도 별도로 관리
```

리팩토링된 `processOrder`는 이제 신문 기사의 헤드라인처럼 읽힙니다. 세부 사항이 궁금하다면 각 함수로 들어가면 되고, 흐름만 파악하고 싶다면 이 코드만으로도 충분합니다.

---

## 3. 깨달음과 성장

추상화 수준을 맞추는 법을 배우며 깨달은 점은, 좋은 코드는 **'독자(Reader)의 인지 부하를 줄여주는 코드'**라는 사실입니다. 모든 코드를 한 번에 이해하려 하지 않고, 필요한 만큼만 깊이 들어가서 볼 수 있는 구조가 협업 효율을 비약적으로 높여주었습니다.

또한, 추상화 수준이 잘 분리된 코드는 단위 테스트(Unit Testing)를 작성하기도 훨씬 수월했습니다. 로우레벨의 복잡함을 모킹(Mocking)으로 걷어내면 순수 비즈니스 로직만 집중적으로 검증할 수 있기 때문입니다.

---

## 회고

그동안은 함수를 쪼개는 게 단지 줄 수를 줄이기 위한 작업이라 생각했습니다. 하지만 이제는 **"이 함수가 읽는 사람에게 전달하는 추상적인 메시지가 일관된가?"**를 먼저 고민합니다. "무엇을 하는지"와 "어떻게 구현했는지"를 명확히 분리하며 설계하는 습관이 좋은 엔지니어로 성장하는 데 큰 밑거름이 되고 있습니다.
