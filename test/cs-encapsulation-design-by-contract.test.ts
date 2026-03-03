import { describe, it, expect } from 'vitest';

/**
 * Encapsulation & Design by Contract (DbC) Example
 * 
 * - Encapsulation: Private state, public methods as controlled access.
 * - DbC: Preconditions (check inputs), Postconditions (guarantee outputs), Invariants (always true).
 */

class BankAccount {
    private balance: number = 0; // Encapsulated state

    deposit(amount: number): void {
        // PRECONDITION: amount must be positive
        if (amount <= 0) {
            throw new Error('Deposit amount must be positive');
        }

        const previousBalance = this.balance;
        this.balance += amount;

        // POSTCONDITION: Internal balance must have increased accurately
        if (this.balance !== previousBalance + amount) {
            throw new Error('Integrity Error: Deposit failed');
        }
    }

    withdraw(amount: number): void {
        // PRECONDITION: amount must be positive and enough balance
        if (amount <= 0) {
            throw new Error('Withdraw amount must be positive');
        }
        if (amount > this.balance) {
            throw new Error('Insufficient funds');
        }

        this.balance -= amount;

        // INVARIANT: balance must NEVER be negative (checked after modification)
        if (this.balance < 0) {
            throw new Error('Invariant Violated: Balance cannot be negative');
        }
    }

    getBalance(): number {
        return this.balance;
    }
}

describe('Encapsulation & Design by Contract', () => {
    it('should respect positive deposit precondition', () => {
        const account = new BankAccount();
        expect(() => account.deposit(-100)).toThrow('Deposit amount must be positive');
    });

    it('should respect withdrawal pre-conditions', () => {
        const account = new BankAccount();
        account.deposit(100);
        expect(() => account.withdraw(150)).toThrow('Insufficient funds');
    });

    it('should encapsulate balance (private)', () => {
        const account = new BankAccount();
        // TypeScript check: account.balance would fail here
        expect(account.getBalance()).toBe(0);
    });
});
