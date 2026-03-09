import { describe, it, expect, vi } from 'vitest';
import { registerUserMessy, RegisterUserUseCase, UserEntity, UserRepository, EmailService } from './architecture-demo';

describe('User Registration Logic Comparison', () => {

    describe('Messy approach', () => {
        it('should register user with everything in one function', async () => {
            const user = await registerUserMessy('test@example.com', 'Tester');
            expect(user.email).toBe('test@example.com');
        });

        it('should throw error for invalid email', async () => {
            await expect(registerUserMessy('invalid-email', 'Tester')).rejects.toThrow('Invalid email format');
        });
    });

    describe('Structured (Architectural) approach', () => {
        it('should register user through clean layers', async () => {
            // 모킹을 통해 인프라단(DB, 메일) 없이 비즈니스 로직만 단독 테스트 가능
            const mockRepo: UserRepository = {
                save: vi.fn().mockResolvedValue(undefined),
                findByEmail: vi.fn().mockResolvedValue(null)
            };
            const mockEmail: EmailService = {
                sendWelcome: vi.fn().mockResolvedValue(undefined)
            };

            const useCase = new RegisterUserUseCase(mockRepo, mockEmail);
            const user = await useCase.execute('clean@example.com', 'Cleaner');

            expect(user.email).toBe('clean@example.com');
            expect(mockRepo.save).toHaveBeenCalledTimes(1);
            expect(mockEmail.sendWelcome).toHaveBeenCalledTimes(1);
        });

        it('should validate email within the Entity', () => {
            expect(() => new UserEntity('invalid', 'Tester')).toThrow('Invalid User');
        });
    });
});
