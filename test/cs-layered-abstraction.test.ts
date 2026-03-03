import { describe, it, expect, vi } from 'vitest';

/**
 * Layered Abstraction Example
 * 
 * - Layer 1 (Data): Handles database/persistence details.
 * - Layer 2 (Service): Handles business logic (doesn't care about DB).
 * - Layer 3 (Presentation): Handles UI/API entry (doesn't care about logic).
 */

// --- Layer 1: Data Access (Repository) ---
class UserRepository {
    async save(user: any) {
        console.log('Inserting into PostgreSQL...');
    }
}

// --- Layer 2: Business Logic (Service) ---
class UserService {
    constructor(private repo: UserRepository) { }
    async register(data: any) {
        // Business logic here (e.g., validation, normalization)
        if (!data.email) throw new Error('Email required');
        await this.repo.save(data);
    }
}

// --- Layer 3: Presentation (Controller) ---
class UserController {
    constructor(private service: UserService) { }
    async handlePost(req: any, res: any) {
        // UI/API logic here (parsing request, setting status codes)
        try {
            await this.service.register(req.body);
            res.status(200).send('OK');
        } catch (e: any) {
            res.status(400).send(e.message);
        }
    }
}

describe('Layered Abstraction', () => {
    it('Presentation layer only communicates with Service layer', async () => {
        const mockService = { register: vi.fn() } as any;
        const controller = new UserController(mockService);
        const mockRes = { status: vi.fn().mockReturnThis(), send: vi.fn() } as any;

        await controller.handlePost({ body: { email: 'test@t.com' } }, mockRes);

        expect(mockService.register).toHaveBeenCalledWith({ email: 'test@t.com' });
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });
});
