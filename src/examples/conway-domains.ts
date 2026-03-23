/**
 * 콘웨이의 법칙(Conway's Law)을 시스템 구조에 반영한 예제입니다.
 * 팀의 경계(Team Boundaries)가 모듈의 경계(Module Boundaries)가 되는 양상을 보여줍니다.
 */

// --- Product 팀의 도메인 모델 ---
export interface Product {
  id: string;
  name: string;
  price: number;
}

export class ProductService {
  private products: Product[] = [
    { id: '1', name: 'MFE Architecture Book', price: 35000 },
  ];

  getProduct(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }
}

// --- Billing 팀의 도메인 모델 ---
// Product 팀과 직접적인 의존성을 줄이고, 필요한 데이터만 정의하여 통신합니다.
export interface Bill {
  billId: string;
  amount: number;
  status: 'PENDING' | 'PAID';
}

export class BillingService {
  private bills: Bill[] = [];

  /**
   * Product 정보가 필요할 때 전체 Product 객체를 넘기기보다
   * 필요한 'ID'와 'Price' 정보만 받아 처리하도록 설계하여 팀 간 통신 비용을 최소화합니다.
   */
  createBillForProduct(productId: string, price: number): Bill {
    const newBill: Bill = {
      billId: `BILL-${productId}-${Date.now()}`,
      amount: price,
      status: 'PENDING',
    };
    this.bills.push(newBill);
    return newBill;
  }
}
