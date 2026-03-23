---
published: true
title: "콘웨이의 법칙(Conway's Law): 조직의 소통 구조가 시스템을 만든다"
description: "소프트웨어 아키텍처가 왜 조직의 의사소통 구조를 닮아가는지, 그리고 이를 역으로 활용하는 '역 콘웨이 전략'이란 무엇인지 학습한 내용을 공유합니다."
date: "2026-03-23"
tags: ["Architecture", "DevOps"]
---

# 콘웨이의 법칙(Conway's Law): 조직의 소통 구조가 시스템을 만든다

![콘웨이의 법칙 시각화 도식](/public/images/conways-law-concept.png)

"시스템을 설계하는 조직은 그 조직의 소통 구조를 복제한 설계를 만들게 된다." 

1967년 멜빈 콘웨이(Melvin Conway)가 제안한 이 문장은 반세기가 지난 지금까지도 소프트웨어 아키텍처 세계에서 강력한 통찰을 제공하고 있습니다. 마이크로 프런트엔드와 MSA를 학습하던 중, 기술적인 선택만큼이나 **팀의 구조**가 시스템의 모습에 결정적인 영향을 미친다는 사실을 깨닫고 이를 깊이 있게 탐색해 보았습니다.

---

## 1. 콘웨이의 법칙이란 무엇인가?

콘웨이의 법칙은 간단히 말해 **"소프트웨어의 구조는 그 소프트웨어를 만드는 사람들의 의사소통 구조를 닮는다"**는 원리입니다.

예를 들어, 프런트엔드 팀, 백엔드 팀, DB 팀이 완전히 분리되어 소통하고 있다면, 시스템 역시 프런트엔드 레이어, API 레이어, 데이터베이스 레이어로 엄격하게 나뉜 계층형(Layered) 아키텍처가 될 가능성이 큽니다. 반대로, 결제 기능을 위해 기획자, 개발자, 디자이너가 한 팀으로 뭉쳐 있다면 그 시스템은 '결제 서비스'라는 독립적인 모듈로 발전하게 됩니다.

구조가 소통을 결정하는 것이 아니라, **소통의 한계가 시스템의 구조적 한계를 결정한다**는 점이 핵심적인 깨달음이었습니다.

---

## 2. 역 콘웨이 전략 (Inverse Conway Maneuver)

학습을 통해 흥미로운 전략 하나를 더 알게 되었습니다. 바로 **역 콘웨이 전략(Inverse Conway Maneuver)**입니다. 만약 우리가 원하는 이상적인 시스템 아키텍처가 있다면(예: 독립적인 서비스들이 유기적으로 연결된 MSA), 그 아키텍처에 맞게 **조직의 구조를 먼저 재배치**하는 것입니다.

- **목표 아키텍처**: 서비스 간의 느슨한 결합(Loose Coupling).
- **조직 개편**: 기능별(Functional) 팀이 아닌, 비즈니스 영역별(Domain-centric) 크로스 기능팀으로 재구성.

이 전략은 기술적인 해결책만으로 아키텍처를 개선하려 할 때 겪는 좌절을 해결해 줄 수 있는 힌트가 되었습니다.

---

## 3. 실전 예제: 도메인 경계를 통한 서비스 분리

각 팀이 서로의 내부 구현에 깊게 관여하지 않고, 오직 필요한 인터페이스로만 소통할 때 시스템은 더 유연해집니다. 콘웨이의 법칙을 반영하여 '상품 팀'과 '정산 팀'의 책임을 명확히 나눈 예제 코드를 작성해 보았습니다.

### MFE/MSA 구조를 고려한 도메인 분리 구현

```typescript
/**
 * 콘웨이의 법칙을 시스템 구조에 반영한 예제입니다.
 * 팀의 경계(Team Boundaries)가 모듈의 경계(Module Boundaries)가 됩니다.
 */

// --- 상품 팀 (Product Team) 영역 ---
export class ProductService {
  private products = [{ id: '1', name: 'Architecture Guide', price: 35000 }];

  getProduct(id: string) {
    return this.products.find(p => p.id === id);
  }
}

// --- 정산 팀 (Billing Team) 영역 ---
export class BillingService {
  /**
   * 정산 팀은 상품 팀의 내부 로직을 알 필요가 없습니다.
   * 협의된 최소한의 인터페이스(id, price)만 받아 정산 데이터를 생성합니다.
   */
  createBill(productId: string, price: number) {
    return {
      billId: `BILL-${productId}-${Date.now()}`,
      amount: price,
      status: 'PENDING',
    };
  }
}
```

### 테스트를 통한 인터페이스 검증

작성한 두 도메인이 서로의 내부 상태를 침범하지 않고, 약속된 데이터 구조로만 소통하는지 검증했습니다. 이를 통해 팀 간의 '커뮤니케이션 오버헤드'가 실제 시스템 코드의 '결합도'로 이어지는 지점을 확인할 수 있었습니다.

```typescript
import { describe, it, expect } from 'vitest';
import { ProductService, BillingService } from '../src/examples/conway-domains';

describe("비즈니스 도메인 분리 테스트", () => {
    it("각 서비스 팀의 도메인은 독립적으로 운영되어야 함", () => {
        const productService = new ProductService();
        const billingService = new BillingService();
        
        const product = productService.getProduct('1');
        const bill = billingService.createBill(product!.id, product!.price);

        expect(bill.amount).toBe(35000);
    });
});
```

---

## 💡 마치며: 기술보다 먼저 사람을 보라

콘웨이의 법칙을 학습하며 내린 결론은, **"훌륭한 아키텍처를 설계하고 싶다면, 먼저 훌륭한 소통 구조를 갖춘 팀을 만들어야 한다"**는 것입니다.

코드의 결합도가 너무 높아서 고민이라면, 혹시 두 모듈을 담당하는 개발자들 사이의 소통이 너무 잦거나 불명확하지 않았는지 되돌아볼 필요가 있습니다. 반대로 코드 수정이 너무 느리다면, 의사결정 경로가 너무 복잡하게 꼬여 있을지도 모릅니다.

이제 새로운 프로젝트를 시작하거나 아키텍처를 변경할 때, 단순히 '어떤 프레임워크를 쓸지'를 고민하기에 앞서 '팀원들이 어떻게 소통하며 시너지를 낼 구조를 만들 것인지'를 먼저 그려보려 합니다. 아키텍처는 결국 사람이 쓴 소리를 기계가 이해하도록 옮겨놓은 지도이기 때문입니다.