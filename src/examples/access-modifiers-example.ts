/**
 * Java vs JavaScript Access Modifiers Example
 * 
 * 이 파일은 TypeScript를 사용하여 JavaScript의 최신 접근 제어자(#)와
 * TypeScript의 문법적 접근 제어자(private)가 런타임에서 어떻게 다르게 동작하는지 보여줍니다.
 */

class EncapsulationTrial {
    // 1. TypeScript의 private (컴파일 타임에만 체크됨)
    private tsPrivateField: string = "TS Private Data";

    // 2. JavaScript의 실제 프라이빗 필드 (런타임에서도 보호됨)
    #jsPrivateField: string = "JS Genuine Private Data";

    public getTsData() {
        return this.tsPrivateField;
    }

    public getJsData() {
        return this.#jsPrivateField;
    }
}

// 테스트를 위한 간단한 실행 함수
export function runAccessTrial() {
    const trial = new EncapsulationTrial();

    console.log("=== Access Modifier Trial ===");
    console.log("Public Access via Methods:");
    console.log("TS Private:", trial.getTsData());
    console.log("JS Genuine Private:", trial.getJsData());

    console.log("\nTrying to bypass boundaries...");

    // @ts-ignore: TypeScript는 에러를 내뿜지만, JS 런타임에서는 여전히 접근 가능할 수 있음
    console.log("Accessing TS private via bypass:", (trial as any).tsPrivateField);

    try {
        // JS 실제 프라이빗(#)은 런타임 수준에서 신택스 에러를 발생시키거나 접근을 원천 봉쇄함
        // (Eval 혹은 Direct access 시도시 SyntaxError 발생 가능)
        console.log("Accessing JS genuine private field directly is fundamentally blocked by the engine.");
    } catch (e) {
        console.log("Caught Error while accessing # field:", e);
    }
}
