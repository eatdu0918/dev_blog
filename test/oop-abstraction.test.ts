import { describe, it, expect, vi } from 'vitest';

// 추상화된 인터페이스
interface DataStorage {
    save(id: string, data: any): void;
    find(id: string): any;
}

// 인터페이스를 사용하는 서비스
class UserProfileService {
    constructor(private storage: DataStorage) { }

    updateProfile(userId: string, profileData: any) {
        this.storage.save(userId, profileData);
    }
}

describe('UserProfileService Abstraction Test', () => {
    it('should call save on the storage implementation', () => {
        // Mock을 이용한 인터페이스 구현체 생성
        const mockStorage: DataStorage = {
            save: vi.fn(),
            find: vi.fn(),
        };

        const service = new UserProfileService(mockStorage);
        const userId = 'user123';
        const profileData = { name: 'Alice' };

        service.updateProfile(userId, profileData);

        // 구체적인 구현(How)이 아닌 행위(What)가 일어났는지 검증
        expect(mockStorage.save).toHaveBeenCalledWith(userId, profileData);
    });
});
