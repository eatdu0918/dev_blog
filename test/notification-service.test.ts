import { describe, it, expect, vi } from 'vitest';
import { Mailer, NotificationService } from '../src/examples/notification-service';

describe('NotificationService (Vitest의 vi-api 활용 학습)', () => {

    it('vi.spyOn()을 사용하여 외부 의존성(Mailer)이 정상적으로 호출되었는지 확인한다', () => {
        // 실제 인스턴스 생성
        const mailer = new Mailer();
        const service = new NotificationService(mailer);

        // mailer.send()를 가로채서(Spying) 호출 여부를 기록한다.
        const sendSpy = vi.spyOn(mailer, 'send');

        const result = service.notifyUser('user-123', 'test@example.com', 'Hello Vitest!');

        // 1. 결과값 확인
        expect(result).toBe('Notification sent to user-123');

        // 2. Mocking/Spying을 통한 호출 정보 검증
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledWith('test@example.com', 'Hello Vitest!');

        // 사용이 끝난 스파이나 모킹은 다시 원래대로 되돌려(Restore) 전체 테스트 환경의 무결성을 유지한다.
        sendSpy.mockRestore();
    });

    it('vi.fn()을 통해 완전히 가상의 목(Mock) 객체를 생성하여 테스트를 가속화한다', () => {
        // 실제 구현체 없이, '함수의 껍데기'만 만들 수도 있다.
        const mockSend = vi.fn().mockReturnValue(false); // 가상 함수가 무조건 false를 반환하게 설정

        // Mailer를 대체할 수 있는 객체를 리터럴 형태로 주입한다 (DI의 힘)
        const mockMailer = {
            send: mockSend
        } as unknown as Mailer;

        const service = new NotificationService(mockMailer);

        const result = service.notifyUser('user-fail', 'fail@example.com', 'Wait...');

        expect(result).toBe('Failed to notify user-fail');
        expect(mockSend).toHaveBeenCalled();
    });

});
