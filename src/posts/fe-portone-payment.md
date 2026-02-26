---
title: "프론트엔드에서의 결제 모듈 연동과 서버 단일 검증 경험"
description: "외부 결제 SDK(포트원)를 연동하면서 겪었던 과정과, 결제 데이터의 신뢰성 검증에 대한 아키텍처적 깨달음을 정리합니다."
date: "2026-02-25"
tags: ["Frontend", "Payment"]
---

# 프론트엔드에서의 결제 모듈 연동과 서버 단일 검증 경험

개인 프로젝트나 토이 수준을 벗어나 실제 이커머스 플로우를 구현할 때 가장 심리적 장벽이 높았던 기능 중 하나는 실제 재화가 오가는 '결제' 로직이었습니다.

결제 모듈을 붙이기 위해 통합 결제 솔루션인 **PortOne(구 아임포트)**의 브라우저 SDK를 연동해 보았고, 이 과정에서 프론트엔드의 역할과 데이터 신뢰성 확보를 위한 백엔드와의 구조적 분리에 대해 배운 점을 회고합니다.

---

## 🛠️ 결제 모달 호출 (클라이언트 영역)

먼저 공식 문서를 참조하여 프론트엔드 단에서 결제창을 호출하는 기본 로직은 수월하게 연동할 수 있었습니다. 주문 데이터를 넘겨 `requestPayment` SDK 함수를 호출하고 실행 결과를 받는 형태였습니다.

```typescript
import * as PortOne from "@portone/browser-sdk";

export const requestPayment = async (orderData: OrderInfo) => {
    // 1. 브라우저에서 포트원 SDK 레이어를 띄운다
    const response = await PortOne.requestPayment({
        storeId: "store-uuid-ex", 
        channelKey: "channel-key-ex",
        paymentId: orderData.orderNumber,
        orderName: orderData.productName,
        totalAmount: orderData.totalPrice,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
    });

    // 2. 콜백의 취소/에러 반환 처리
    if (response.code !== undefined) {
        throw new Error(response.message);
    }

    return response; // 결제 식별자 등 반환
};
```

이 단계까지 작성했을 때, SDK 호출이 성공했으니 곧장 뷰 컴포넌트 상태를 변경하고 "주문이 확정되었습니다"라는 성공 화면으로 전환해야겠다고 단순 접근을 시도했습니다.

---

## ⚠️ 클라이언트 측 조작 가능성과 서버 검증 로직 구현

코드 리뷰 과정 등을 통해, 프론트엔드(브라우저)에서 포트원 성공 응답이 넘어온 것만으로 내부 비즈니스 로직(DB 재고 차감, 구매 확정)을 돌려버리는 것이 매우 위험한 설계임을 인지했습니다. 앞선 브라우저 환경에서 발생한 데이터는 네트워크 변조 도구를 비롯한 클라이언트 사이드 조작에 노출되어 있을 가능성이 컸습니다.

결제 금액이나 식별자가 조작된 상태로 주문이 완료처리되는 것을 방지하기 위해 프로세스 중간에 백엔드 검증 로직을 강제해야 했습니다. 클라이언트는 결제창을 띄우고 발급받은 결제 식별자(`paymentId`)만을 백엔드로 이관합니다. **그 후, 백엔드 서버가 밴더사단(포트원 서버)에 직접 API 요청을 보내 실제 결제가 이뤄진 금액과 이쪽 서버 DB상의 상품 비용 합계가 일치하는지 백도어 검증(단일 진실 공급원 역할)을 수행하게 설계했습니다.**

### 서버 검증 단계의 추가
```typescript
    // ... 프론트엔드 결제 인증 모달 통과 이후 처리 ...

    // 3. 결제가 끝났다는 사실만 백엔드에 전달하여 직접 조회 검증(Verification)을 요청
    const verifyResult = await api.post('/api/v1/payments/verify', {
        paymentId: response.paymentId, 
        orderNumber: orderData.orderNumber
    });

    if(!verifyResult.isSuccess) {
       throw new Error("서버 검증 중 비정상적인 결제 정보가 확인되었습니다.");
    }
    // 이 구간 통과 후에야 프론트 진영에서 최종 성공 뷰로 라우팅
```

---

## 💡 종합적인 회고

해당 과정은 단순히 외부 SDK를 끌어다 쓰는 것을 넘어서, **"클라이언트 환경(Node.js 위가 아닌 사용자 브라우저상)에서 일어난 데이터와 로직은 최종 비즈니스 요건 충족의 권한을 가져선 안 되며 완벽히 신뢰할 수 없다"**는 핵심 아키텍처 룰을 실전에서 체감케 한 경험이었습니다.

프론트엔드는 사용자 친화적으로 결제 이탈 없이 플로우를 진행해주고 도메인 식별 정보를 안전하게 이관하는 데 역할이 머무르며, 민감한 트랜잭션의 승인은 무조건 통제된 서버 측을 경유해야 한다는 책임 주도 분배를 깊이 이해하게 되었습니다.
