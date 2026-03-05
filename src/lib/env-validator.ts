/**
 * @file env-validator.ts
 * @description 필수 환경 변수가 설정되었는지 확인하는 유틸리티입니다.
 */

export function validateEnv() {
    const envConfigs = {
        DATABASE_URL: process.env.DATABASE_URL,
        DIRECT_URL: process.env.DIRECT_URL,
    };

    const missing = Object.entries(envConfigs)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        throw new Error(`필수 환경 변수가 누락되었습니다: ${missing.join(', ')}`);
    }

    return true;
}
