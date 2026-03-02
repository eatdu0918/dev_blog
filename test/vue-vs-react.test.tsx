import { describe, it, expect, vi } from 'vitest';

describe('React vs Vue Core Concepts Simulation', () => {

    describe('Vue: Reactivity System (Proxy Simulation)', () => {
        // Vue3의 reactive 원리를 간단히 흉내낸 코드
        function reactive<T extends object>(target: T, sideEffect: () => void): T {
            return new Proxy(target, {
                set(obj, prop, value) {
                    obj[prop as keyof T] = value;
                    sideEffect(); // 데이터가 변경되면 자동으로 부수효과(렌더링 등) 발생
                    return true;
                }
            });
        }

        it('should trigger side effects automatically on data mutation', () => {
            const renderMock = vi.fn();

            const state = reactive({ count: 0 }, renderMock);

            expect(renderMock).not.toHaveBeenCalled();

            // Vue 스타일의 직접 변이 (mutation)
            state.count++;

            expect(state.count).toBe(1);
            expect(renderMock).toHaveBeenCalledTimes(1);

            state.count = 5;
            expect(renderMock).toHaveBeenCalledTimes(2);
        });
    });

    describe('React: Unidirectional Data Flow Simulation', () => {
        // React의 useState 불변성 원리를 간단히 흉내낸 코드
        it('requires immutable updates to trigger "render"', () => {
            let state = { count: 0 };
            const renderMock = vi.fn();

            function setState(newState: { count: number }) {
                if (state !== newState) {
                    state = newState;
                    renderMock();
                }
            }

            // 직접 변이 (mutation) - 상태는 변했지만 렌더링이 트리거되지 않음
            state.count = 1;
            expect(renderMock).not.toHaveBeenCalled();

            // 불변성을 지킨 업데이트 (새로운 객체 할당)
            setState({ count: state.count + 1 });
            expect(renderMock).toHaveBeenCalledTimes(1);
            expect(state.count).toBe(2);
        });
    });
});
