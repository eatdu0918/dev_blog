import { describe, it, expect } from 'vitest';

class TestClass {
    private tsPrivate = "TS Private";
    #jsPrivate = "JS Private";

    getJsPrivate() {
        return this.#jsPrivate;
    }
}

describe('Access Modifiers Behavior', () => {
    it('TypeScript private can be bypassed using type casting at runtime', () => {
        const instance = new TestClass();

        // TypeScript 컴파일러 수준에서는 에러지만, 런타임 객체에는 그대로 존재함
        const value = (instance as any).tsPrivate;
        expect(value).toBe("TS Private");
    });

    it('JavaScript # private is not accessible even at runtime via normal object key access', () => {
        const instance = new TestClass();

        // # 필드는 객체의 일반적인 키로 열거되지 않으며, 대괄호 표기법 등으로도 접근 불가
        // 런타임 엔진 수준에서 외부 접근을 차단함
        expect((instance as any)["#jsPrivate"]).toBeUndefined();
    });

    it('Internal methods can access both', () => {
        const instance = new TestClass();
        expect(instance.getJsPrivate()).toBe("JS Private");
    });
});
