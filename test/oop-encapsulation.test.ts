import { describe, it, expect } from 'vitest';

class VendingMachine {
    private balance: number = 0;
    private readonly itemPrice: number = 1000;

    public insertCoin(amount: number): void {
        if (amount <= 0) return;
        this.balance += amount;
    }

    public purchaseItem(): boolean {
        if (this.balance >= this.itemPrice) {
            this.balance -= this.itemPrice;
            return true;
        }
        return false;
    }

    public getBalance(): number {
        return this.balance;
    }
}

describe('VendingMachine Encapsulation Test', () => {
    it('should increase balance when inserting coins', () => {
        const vm = new VendingMachine();
        vm.insertCoin(500);
        expect(vm.getBalance()).toBe(500);
        vm.insertCoin(500);
        expect(vm.getBalance()).toBe(1000);
    });

    it('should not increase balance for invalid coin amounts', () => {
        const vm = new VendingMachine();
        vm.insertCoin(-100);
        expect(vm.getBalance()).toBe(0);
    });

    it('should allow purchase when balance is sufficient', () => {
        const vm = new VendingMachine();
        vm.insertCoin(1000);
        const success = vm.purchaseItem();
        expect(success).toBe(true);
        expect(vm.getBalance()).toBe(0);
    });

    it('should fail purchase when balance is insufficient', () => {
        const vm = new VendingMachine();
        vm.insertCoin(500);
        const success = vm.purchaseItem();
        expect(success).toBe(false);
        expect(vm.getBalance()).toBe(500);
    });
});
