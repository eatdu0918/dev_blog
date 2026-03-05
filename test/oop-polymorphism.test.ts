import { describe, it, expect, vi } from 'vitest';

interface PaymentProcessor {
    pay(amount: number): boolean;
}

class CardPayment implements PaymentProcessor {
    pay(amount: number) { return true; }
}

class PointPayment implements PaymentProcessor {
    pay(amount: number) { return true; }
}

class OrderManager {
    processOrder(processor: PaymentProcessor, amount: number) {
        return processor.pay(amount);
    }
}

describe('OrderManager Polymorphism Test', () => {
    it('should process payment regardless of the specific processor type', () => {
        const orderManager = new OrderManager();

        // 카드 결제로 처리
        const cardProcessor = new CardPayment();
        expect(orderManager.processOrder(cardProcessor, 1000)).toBe(true);

        // 포인트 결제로 처리 (동일한 OrderManager 로직 사용)
        const pointProcessor = new PointPayment();
        expect(orderManager.processOrder(pointProcessor, 500)).toBe(true);
    });
});
