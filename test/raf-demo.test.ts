import { describe, it, expect, vi } from 'vitest';
import { animate } from './raf-demo';

describe('requestAnimationFrame Animation Test', () => {
    it('should update element style and call rAF recursively', () => {
        const mockElement = {
            style: { transform: '' }
        };
        const mockRaf = vi.fn();

        // 애니메이션 시작
        animate(mockElement, 1000, 500, mockRaf as any);

        // 첫 번째 rAF 호출 확인
        expect(mockRaf).toHaveBeenCalled();

        // 콜백 실행 시뮬레이션
        const callback = mockRaf.mock.calls[0][0];
        callback(100); // 1. 첫 호출 (start=100) -> 500 * (0/1000) = 0px? 
        // 아, 첫 호출 시점에는 progress가 0임.
        // animate 내부: if (!start) start = timestamp; progress = timestamp - start;
        // callback(100) -> start = 100, progress = 0.

        expect(mockElement.style.transform).toBe('translateX(0px)');

        callback(200); // 2. 두 번째 호출 (progress = 200 - 100 = 100)
        // 500 * (100/1000) = 50px
        expect(mockElement.style.transform).toBe('translateX(50px)');
    });

    it('should stop at the max distance and not call next rAF', () => {
        const mockElement = {
            style: { transform: '' }
        };
        const mockRaf = vi.fn();

        animate(mockElement, 1000, 500, mockRaf as any);
        const callback = mockRaf.mock.calls[0][0];

        callback(100);  // start = 100, progress = 0
        callback(1200); // progress = 1100 (> duration 1000)

        expect(mockElement.style.transform).toBe('translateX(500px)');

        // Initial call + callback(100) call (total 2)
        // callback(1200) should NOT call raf again.
        expect(mockRaf).toHaveBeenCalledTimes(2);
    });
});
