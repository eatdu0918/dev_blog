import { describe, it, expect } from 'vitest';
import { performHeavyCalculation } from '../src/examples/v8-optimization';

describe('V8 엔진 동작 원리 학습', () => {
    it('일관된 객체 구조를 활용한 연산이 정상적으로 수행됨을 확인한다', () => {
        const result = performHeavyCalculation();
        expect(result).toBeGreaterThan(0);
        // 이 코드가 Ignition 인터프리터에서 TurboFan 최적화로 
        // 성공적으로 넘어가는 파이프라인을 상상해 봅니다.
    });
});
