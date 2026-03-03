import { describe, it, expect, vi } from 'vitest';

/**
 * Level of Abstraction Example
 * 
 * - High Level: "What" to do (Business logic)
 * - Low Level: "How" to do (Implementation details)
 * 
 * Rule: Single Level of Abstraction (SLA). Don't mix levels in one function.
 */

// --- Mixed Levels (BAD) ---
async function mixedProcessOrder(orderId: string) {
    // Low level: Logic for DB lookup
    console.log(`SELECT * FROM orders WHERE id = ${orderId}`);
    const order = { id: orderId, item: 'PC', price: 1000 };

    // High level: Business logic
    if (order.price > 500) {
        console.log('Sending discount coupon for high-priced order');
    }

    // Low level: Logic for HTTP call
    console.log(`POST https://api.coupan.com/send -d '{"id": "${orderId}"}'`);
}

// --- Single Level of Abstraction (GOOD) ---
class OrderService {
    async process(orderId: string) {
        const order = await this.getOrder(orderId); // High level (What)
        this.checkEligibility(order);               // High level (What)
        await this.notifyOrder(order);              // High level (What)
    }

    // Implementation details (Low level - "How")
    private async getOrder(id: string) {
        return { id, item: 'PC', price: 1000 };
    }
    private checkEligibility(order: any) {
        if (order.price > 500) console.log('Eligible!');
    }
    private async notifyOrder(order: any) {
        console.log('Notifying...');
    }
}

describe('Level of Abstraction', () => {
    it('High-level function should only call other abstracted methods', async () => {
        const service = new OrderService();
        // We can spy on sub-methods to see if high-level logic flows correctly
        const spyGet = vi.spyOn(service as any, 'getOrder');
        const spyCheck = vi.spyOn(service as any, 'checkEligibility');

        await service.process('123');

        expect(spyGet).toHaveBeenCalledWith('123');
        expect(spyCheck).toHaveBeenCalled();
    });
});
