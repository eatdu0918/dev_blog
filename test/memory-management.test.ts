import { describe, it, expect } from 'vitest';
import { MemoryNode, simulateCircularReference } from '../src/examples/memory-demo';

describe('Memory Management Simulation', () => {
    it('순환 참조가 발생해도 루트와의 연결이 끊기면 논리적으로 수거 대상이 됨을 이해합니다', () => {
        const result = simulateCircularReference();
        expect(result).toBe("Disconnected from Root");
        // 실제 GC 타이밍은 런타임의 몫이지만, 개발자는 도달 가능성(Reachability)을 끊는 것에 집중해야 합니다.
    });
    
    it('참조가 남아있는 한 메모리는 해제되지 않습니다', () => {
        const root = new MemoryNode("Root");
        const leaf = new MemoryNode("Leaf");
        root.partner = leaf;
        
        // root가 살아있는 한 leaf도 REACHABLE 하므로 안전하게 보존됩니다.
        expect(root.partner?.name).toBe("Leaf");
    });
});
