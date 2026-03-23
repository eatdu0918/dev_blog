import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '../src/examples/mfe-event-bus';

describe('MicroFrontendEventBus (MFE Communication Test)', () => {
    beforeEach(() => {
        // 테스트 전후로 상태를 초기화합니다.
        eventBus.clear();
    });

    it('구독 중인 이벤트가 발생하면 콜백 함수가 실행되어야 함', () => {
        const callback = vi.fn();
        const testData = { id: 1, name: 'Micro App A' };

        eventBus.subscribe('APP_A_LOADED', callback);
        eventBus.publish('APP_A_LOADED', testData);

        expect(callback).toHaveBeenCalledWith(testData);
    });

    it('여러 개의 구독자가 동일한 이벤트를 수신할 수 있어야 함', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();
        const testData = { message: 'Shared state update' };

        eventBus.subscribe('STATE_SYNC', callback1);
        eventBus.subscribe('STATE_SYNC', callback2);
        
        eventBus.publish('STATE_SYNC', testData);

        expect(callback1).toHaveBeenCalledWith(testData);
        expect(callback2).toHaveBeenCalledWith(testData);
    });

    it('구독이 해제된 이벤트는 더 이상 콜백을 실행하지 않아야 함', () => {
        const callback = vi.fn();

        eventBus.subscribe('REMOVABLE_EVENT', callback);
        eventBus.unsubscribe('REMOVABLE_EVENT', callback);
        
        eventBus.publish('REMOVABLE_EVENT', { data: 'not visible' });

        expect(callback).not.toHaveBeenCalled();
    });

    it('비어 있는 이벤트에 대해 발행하더라도 에러가 발생하지 않아야 함', () => {
        expect(() => {
            eventBus.publish('NON_EXISTENT_EVENT', {});
        }).not.toThrow();
    });
});
