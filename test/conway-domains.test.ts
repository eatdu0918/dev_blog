import { describe, it, expect } from 'vitest';
import { ProductService, BillingService } from '../src/examples/conway-domains';

describe("콘웨이의 법칙 예제: 팀 간 경계에 따른 도메인 분리 테스트", () => {
    it("각 서비스는 자신의 도메인 안에서 독립적으로 작동해야 함", () => {
        const productService = new ProductService();
        const product = productService.getProduct('1');

        expect(product).toBeDefined();
        expect(product?.name).toBe('MFE Architecture Book');
    });

    it("Billing 서비스는 Product 서비스와 최소한의 데이터(ID, Price)로 소통해야 함", () => {
        const billingService = new BillingService();
        const productData = { id: '1', price: 35000 };

        const bill = billingService.createBillForProduct(productData.id, productData.price);

        expect(bill.amount).toBe(productData.price);
        expect(bill.status).toBe('PENDING');
        expect(bill.billId).toContain(productData.id);
    });
});
