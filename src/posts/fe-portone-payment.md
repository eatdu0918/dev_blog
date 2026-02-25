---
title: "현업 수준의 결제 환경 구축: PortOne SDK 연동 가이드"
description: "이커머스의 꽃은 결제! sparta-msa-final-project에서 포트원 SDK를 활용해 실제 결제창을 띄우고 처리하는 전체 파이프라인을 공개합니다."
date: "2026-02-23"
tags: ["React", "PortOne", "Payment", "Frontend", "E-Commerce"]
---

# 현업 수준의 결제 환경 구축: PortOne SDK 연동 가이드

이커머스 프로젝트를 진행하며 가장 짜릿하면서도 조심스러운 순간은 바로 '결제'가 이루어질 때입니다. 직접 모든 PG(Payment Gateway)사와 계약하고 연동하는 것은 매우 복잡하지만, **PortOne(구 아임포트)** 같은 통합 결제 솔루션을 쓰면 훨씬 쉽고 안전하게 결제를 구현할 수 있습니다.

[`sparta-msa-final-project`](https://github.com/eatdu0918/sparta-msa-final-project)에서는 포트원 브라우저 SDK를 활용해 끊김 없는 결제 경험을 구축했습니다.

---

## 🏗️ 결재 프로세스 개요

결제는 프론트엔드에서만 끝나지 않습니다. 데이터 정합성을 위해 백엔드와의 긴밀한 통신이 필요합니다.

1.  **프론트엔드**: 포트원 SDK를 호출하여 결제창을 띄웁니다.
2.  **사용자**: 카드 정보 등을 입력하고 결제를 진행합니다.
3.  **포트원**: 결제 완료 후 고유한 `imp_uid`와 `merchant_uid` 등을 반환합니다.
4.  **프론트엔드**: 받은 정보를 이  백엔드 서버(`payment-service`)로 전달합니다.
5.  **백엔드**: 서버 단에서 다시 한번 포트원 API를 통해 실제 금액이 맞는지 검증하고 최종 결제를 완료합니다.

---

## 🛠️ 핵심 구현: SDK 호출 로직

이  프로젝트의 `src/api/services/payment.ts`의 흐름을 단순화한 코드입니다.

```typescript
import * as PortOne from "@portone/browser-sdk";

export const requestPayment = async (orderData: OrderInfo) => {
    // 1. 포트원 결제창 호출
    const response = await PortOne.requestPayment({
        storeId: "store-uuid-xxx", // 상점 아이디
        channelKey: "channel-key-xxx", // 채널 키
        paymentId: orderData.orderNumber,
        orderName: orderData.productName,
        totalAmount: orderData.totalPrice,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        // 사용자 정보 등...
    });

    // 2. 결과 처리
    if (response.code !== undefined) {
        // 결제 실패 (사용자 취소 등)
        throw new Error(response.message);
    }

    // 3. 백엔드로 결제 성공 정보 전달 (검증 요청)
    return await api.post('/api/v1/payments/verify', {
        paymentId: response.paymentId, // 포트원의 고유 아이디
        orderNumber: orderData.orderNumber
    });
};
```

---

## ⚠️ 절대 놓치면 안 되는 포인트

### 1. 전역 SDK 로딩
SDK 라이브러리를 사용하기 전, 반드시 초기화가 되어 있어야 합니다. `@portone/browser-sdk` 라이브러리를 npm으로 설치하여 쓰면 타입 안정성까지 확보할 수 있습니다.

### 2. 단건 결제 검증 (서버 단 검증 필수!)
프론트엔드에서 결제가 성공했다고 해서 바로 '주문 완료' 처리를 하면 안 됩니다. **클라이언트 코드는 언제든 위변조될 수 있기 때문**입니다. 백엔드에서 결제된 금액과 이  DB의 주문 금액이 일치하는지 포트원 API를 통해 교차 확인하는 과정이 반드시 필요합니다.

### 3. 결제 중 이탈 대응
사용자가 결제창을 띄워놓고 브라우저를 닫거나 네트워크가 끊길 수 있습니다. 이를 대비해 '결제 대기' 상태를 두고, 사후에 웹훅(Webhook) 등을 통해 상태를 맞추는 전략이 필요합니다.

---

## 마무리

결제 연동은 기술적으로 도전적이지만, 성공적으로 구현했을 때의 성취감은 무엇보다 큽니다. 포트원 SDK 덕분에 복잡한 PG 연동을 추상화하고 핵심 비즈니스 로직에 더 집중할 수 있었습니다.

드디어 시리즈의 마지막 포스팅! 폼 데이터를 안전하게 검증하는 **React Hook Form과 Zod** 활용법으로 돌아오겠습니다!
