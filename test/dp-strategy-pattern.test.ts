import { describe, it, expect } from 'vitest';

// 1. 전략 인터페이스 (Strategy Interface)
interface PaymentStrategy {
    pay(amount: number): string;
}

// 2. 구체적인 전략 클래스 구현 (Concrete Strategies)
class CreditCardStrategy implements PaymentStrategy {
    constructor(private name: string, private cardNumber: string) { }

    pay(amount: number): string {
        return `${this.name}님의 신용카드(${this.cardNumber})로 ${amount}원이 결제되었습니다.`;
    }
}

class PayPalStrategy implements PaymentStrategy {
    constructor(private emailId: string) { }

    pay(amount: number): string {
        return `PayPal 계정(${this.emailId})을 통해 ${amount}원이 결제되었습니다.`;
    }
}

class TossPayStrategy implements PaymentStrategy {
    constructor(private phoneNumber: string) { }

    pay(amount: number): string {
        return `토스페이(${this.phoneNumber})로 ${amount}원이 간편 결제되었습니다.`;
    }
}

// 3. 컨텍스트 클래스 (Context)
class ShoppingCart {
    private items: { name: string; price: number }[] = [];

    // 외부에서 주입받아 바뀔 수 있는 전략 객체
    private paymentStrategy: PaymentStrategy | null = null;

    addItem(name: string, price: number) {
        this.items.push({ name, price });
    }

    calculateTotal(): number {
        return this.items.reduce((sum, item) => sum + item.price, 0);
    }

    // 실행 시점에 언제든지 결제 방식을 교체 가능
    setPaymentStrategy(strategy: PaymentStrategy) {
        this.paymentStrategy = strategy;
    }

    checkout(): string {
        const total = this.calculateTotal();

        if (!this.paymentStrategy) {
            throw new Error('결제 수단을 먼저 선택해주세요.');
        }

        // 핵심 비즈니스 로직(결제 처리)를 전략 객체에게 위임 (Delegation)
        return this.paymentStrategy.pay(total);
    }
}

describe('Strategy Pattern', () => {
    it('신용카드 전략을 주입받아 동적으로 결제 수단을 처리할 수 있다', () => {
        const cart = new ShoppingCart();
        cart.addItem('키보드', 150000);
        cart.addItem('마우스', 50000);

        const creditCardPayment = new CreditCardStrategy('James', '1234-5678-9012-3456');
        cart.setPaymentStrategy(creditCardPayment);

        const receipt = cart.checkout();
        expect(receipt).toBe('James님의 신용카드(1234-5678-9012-3456)로 200000원이 결제되었습니다.');
    });

    it('실행 도중에도 페이팔 결제로 전략을 깔끔하게 교체할 수 있다', () => {
        const cart = new ShoppingCart();
        cart.addItem('모니터', 300000);

        const paypalPayment = new PayPalStrategy('james@example.com');
        // 사용자가 결제 수단을 변경했다고 가정
        cart.setPaymentStrategy(paypalPayment);

        const receipt = cart.checkout();
        expect(receipt).toBe('PayPal 계정(james@example.com)을 통해 300000원이 결제되었습니다.');
    });

    it('새로운 결제 수단(토스페이)가 추가되어도 기존 카트 로직 변경 없이 확장 가능하다 (OCP 준수)', () => {
        const cart = new ShoppingCart();
        cart.addItem('책상', 50000);

        // 구체적인 클래스 추가만으로 확장이 완료됨
        const tossPayment = new TossPayStrategy('010-1234-5678');
        cart.setPaymentStrategy(tossPayment);

        expect(cart.checkout()).toBe('토스페이(010-1234-5678)로 50000원이 간편 결제되었습니다.');
    });

    it('전략이 설정되지 않은 상태에서 checkout 시 에러를 던져야 한다', () => {
        const cart = new ShoppingCart();
        cart.addItem('의자', 30000);

        expect(() => cart.checkout()).toThrow('결제 수단을 먼저 선택해주세요.');
    });
});
