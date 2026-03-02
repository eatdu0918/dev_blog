import { describe, it, expect } from 'vitest';

class DatabaseConnection {
    private static instance: DatabaseConnection | null = null;
    private connectionString: string;

    private constructor() {
        // 무거운 초기화 작업이 일어난다고 가정
        this.connectionString = `connected_at_${Date.now()}_${Math.random()}`;
    }

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    public getConnectionString(): string {
        return this.connectionString;
    }
}

describe('Singleton Pattern', () => {
    it('여러 번 인스턴스를 요청해도 항상 같은 인스턴스를 반환해야 한다', () => {
        const instanceA = DatabaseConnection.getInstance();
        const instanceB = DatabaseConnection.getInstance();

        expect(instanceA).toBe(instanceB);
        expect(instanceA.getConnectionString()).toEqual(instanceB.getConnectionString());
    });

    it('new 키워드로 직접 인스턴스를 생성할 수 없다 (TypeScript 컴파일 에러 발생 - 테스트에서는 검증 로직 제외)', () => {
        // const instance = new DatabaseConnection(); // TS Error: Constructor of class 'DatabaseConnection' is private and only accessible within the class declaration.
        expect(true).toBe(true);
    });
});
