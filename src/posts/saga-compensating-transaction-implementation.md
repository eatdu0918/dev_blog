---
title: "Saga 패턴의 마침표: 보상 트랜잭션으로 구현하는 일관성 복구"
date: "2026-03-16"
description: "분산 시스템에서 주문이 취소되었을 때, 여러 서비스에 걸친 데이터들을 어떻게 원래대로 되돌리는지 보상 트랜잭션 설계 과정을 공유합니다."
tags: ["Design Pattern", "Kafka"]
---

MSA 환경에서 여러 서비스가 협력하여 하나의 비즈니스를 처리할 때, 가장 무서운 순간은 '중간에 에러가 났을 때'입니다. 단일 DB라면 `@Transactional` 하나로 모든 것을 롤백할 수 있지만, 물리적으로 떨어진 서비스들 사이에서는 이미 커밋된 데이터를 '반대 연산'을 통해 수동으로 복구해야 합니다. 이를 **보상 트랜잭션(Compensating Transaction)**이라고 합니다.

이번 프로젝트에서 주문 취소 요청이 들어왔을 때 각 서비스가 어떻게 자신의 상태를 복원하는지, 그 복잡한 과정을 구현하며 얻은 인사이트를 정리했습니다.

## 되돌리는 것도 기술: 보상 트랜잭션의 흐름

주문이 생성될 때는 `Order ➔ Product ➔ Discount ➔ Payment` 순으로 순차적으로 성공해 나갑니다. 하지만 취소가 발생하면 이 과정을 역순으로 혹은 독립적으로 원상복구 해야 합니다.

![Saga Compensating Transaction Flow](/public/images/saga_compensating_transaction_flow.png)

1. **취소 요청 접수**: `cancel-service`가 사용자의 취소 의사를 확인하고 `cancel-requested` 이벤트를 발행합니다.
2. **결제 처리**: `payment-service`는 해당 결제 건을 `CANCELLED` 상태로 변경합니다.
3. **쿠폰 복원**: `discount-service`는 사용자가 썼던 쿠폰을 다시 `AVAILABLE` 상태로 되돌립니다. (`restoreCoupon`)
4. **재고 복구**: `product-service`는 차감되었던 상품의 수량을 다시 증가시킵니다.

이 모든 과정은 비동기적으로 일어나며, 각 서비스는 자신이 맡은 작업에 성공하면 결과를 응답하고 실패하면 재시도하거나 운영자에게 알림을 보냅니다.

## 왜 '롤백'이 아닌 '보상'인가?

분산 시스템에서는 이미 데이터베이스에 반영되어 커밋된 정보를 물리적으로 없던 일로 만들 수 없습니다. 따라서 이미 발생한 일에 대해 **'반대되는 행위'**를 수행하여 결과적으로 정함성을 맞춥니다.
- 60,000원 결제 커밋 ➔ 60,000원 환불 커밋
- 재고 1개 차감 완료 ➔ 재고 1개 증가 완료

이러한 접근 방식은 시스템이 거대해질수록 필연적으로 선택하게 되는 일관성 보장 전략임을 이번 프로젝트를 통해 체감했습니다.

## 로직 재구성: 쿠폰 복원(Restore) 예시

`discount-service`에서 이벤트 메시지를 받고 쿠폰 상태를 안전하게 되돌리는 로직을 추상화해 보았습니다.

```typescript
// MSA 보상 트랜잭션 시뮬레이션: 쿠폰 복원
class DiscountService {
  private userCoupons = new Map<number, { id: number; status: string; orderId: number | null }>;

  // Kafka 이벤트를 수신했을 때 호출
  async handleOrderCancelled(event: { orderId: number }) {
    console.log(`[이벤트 수신] 주문 취소에 따른 쿠폰 복원 시도: orderId=${event.orderId}`);
    
    // 해당 주문에서 사용된 쿠폰 찾기
    const userCoupon = Array.from(this.userCoupons.values())
      .find(uc => uc.orderId === event.orderId);

    if (userCoupon) {
      // 보상 트랜잭션: 사용 완료(USED) 상태를 다시 사용 가능(AVAILABLE)으로 변경
      userCoupon.status = 'AVAILABLE';
      userCoupon.orderId = null;
      console.log(`[복구 완료] 쿠폰 ${userCoupon.id}가 다시 사용 가능한 상태가 되었습니다.`);
    }
  }
}
```

## 마치며

기능을 만드는 '해피 패스(Happy Path)'보다, 문제가 생겼을 때 시스템을 안전하게 수습하는 '새드 패스(Sad Path)'를 설계하는 것이 훨씬 더 많은 시간과 공수가 든다는 것을 배웠습니다. 하지만 바로 이 지점이 시스템의 신뢰도를 결정하는 핵심이라는 점을 잊지 말아야겠습니다. 

단순히 "에러 로그만 잘 남기자"는 수준을 넘어, 시스템 스스로가 오류를 인지하고 일관성을 복구할 수 있는 아키텍처를 고민하며 진정한 백엔드 개발에 한 걸음 더 다가간 기분입니다.
