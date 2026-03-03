import { describe, it, expect } from 'vitest';

/**
 * Leaky Abstraction Example
 * 
 * - Abstraction: Database class that "hides" SQL details.
 * - Leak: Catching a specific low-level SQL error in high-level service logic.
 */

class Database {
    async saveUser(user: any) {
        if (user.id === 'duplicate') {
            // A low-level "Leak": throwing raw database driver error
            throw new Error('SQL_ERROR_CODE_23505: Unique constraint violation');
        }
    }
}

class UserService {
    constructor(private db: Database) { }

    async registerUser(userData: any) {
        try {
            await this.db.saveUser(userData);
        } catch (err: any) {
            // LEAK: The service layer has to "know" DB-specific error codes
            // to handle business logic (like user already exists).
            if (err.message.includes('23505')) {
                return { success: false, msg: 'User already exists' };
            }
            throw err;
        }
        return { success: true };
    }
}

describe('Leaky Abstraction', () => {
    it('Service layer leak by handling low-level error codes', async () => {
        const db = new Database();
        const service = new UserService(db);

        const result = await service.registerUser({ id: 'duplicate' });

        // This test proves that the abstraction "Database" leaked 
        // its internal SQL error format into "UserService"
        expect(result.success).toBe(false);
        expect(result.msg).toBe('User already exists');
    });
});
