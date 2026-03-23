import { describe, it, expect } from 'vitest';
import { UserService, UserRepoStub, UserRepoFake, UserRepoMock } from '../src/examples/test-double-example';

describe('테스트 더블(Test Double)의 유형별 학습', () => {

    it('Stub: 메서드가 정해진 값을 반환하도록 설정하여 서비스 호출을 확인한다', () => {
        const stubRepo = new UserRepoStub();
        const service = new UserService(stubRepo);
        
        // 1번 사용자를 조회하면 스텁이 무조건 { id: 1, name: "Stub User" }를 반환함
        expect(service.getUserName(1)).toBe("Stub User");
    });

    it('Fake: 메모리 기반의 저장소를 구현하여 상태 변화를 검증한다', () => {
        const fakeRepo = new UserRepoFake();
        const service = new UserService(fakeRepo);
        
        service.createNewUser(10, 'Fake User');
        // 가짜(Fake) 저장소가 실제로 데이터를 들고 있음(상태 검증)
        expect(service.getUserName(10)).toBe("Fake User");
    });

    it('Mock: 메서드가 몇 번 불렸는지, 어떤 인자가 전달되었는지(행위)를 검증한다', () => {
        const mockRepo = new UserRepoMock();
        const service = new UserService(mockRepo);
        
        service.createNewUser(99, 'Mock User');
        
        // 데이터가 저장되었는가가 아니라, 'save()가 1번 불렸는가'를 검증함(행위 검증)
        expect(mockRepo.saveCalledCount).toBe(1);
        expect(mockRepo.lastSavedUser.name).toBe('Mock User');
    });

});
