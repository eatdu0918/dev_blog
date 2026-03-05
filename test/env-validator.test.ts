import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateEnv } from '../src/lib/env-validator';

describe('validateEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.stubGlobal('process', { ...originalEnv, env: { ...originalEnv } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('필수 환경 변수가 모두 존재하면 true를 반환한다', () => {
        process.env.DATABASE_URL = 'postgresql://user:pass@host:6543/db';
        process.env.DIRECT_URL = 'postgresql://user:pass@host:5432/db';

        expect(validateEnv()).toBe(true);
    });

    it('DATABASE_URL이 없으면 에러를 발생시킨다', () => {
        delete process.env.DATABASE_URL;
        process.env.DIRECT_URL = 'postgresql://user:pass@host:5432/db';

        expect(() => validateEnv()).toThrow('필수 환경 변수가 누락되었습니다: DATABASE_URL');
    });

    it('DIRECT_URL이 없으면 에러를 발생시킨다', () => {
        process.env.DATABASE_URL = 'postgresql://user:pass@host:6543/db';
        delete process.env.DIRECT_URL;

        expect(() => validateEnv()).toThrow('필수 환경 변수가 누락되었습니다: DIRECT_URL');
    });
});
