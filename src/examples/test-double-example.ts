/**
 * 테스트 더블(Test Double)의 다양한 형태를 시뮬레이션하기 위한 코드입니다.
 */

export interface UserRepository {
    findById(id: number): { id: number; name: string } | null;
    save(user: { id: number; name: string }): void;
}

export class UserService {
    constructor(private repo: UserRepository) {}

    getUserName(id: number): string {
        const user = this.repo.findById(id);
        return user ? user.name : "Unknown";
    }

    createNewUser(id: number, name: string): void {
        this.repo.save({ id, name });
    }
}

// 1. Stub (스텁): 정해진 값을 반환하도록 설정
export class UserRepoStub implements UserRepository {
    findById(id: number) {
        return { id: 1, name: "Stub User" };
    }
    save(user: any) {}
}

// 2. Fake (페이크): 실제 구현체(DB) 대신 메모리 맵 사용
export class UserRepoFake implements UserRepository {
    private users = new Map<number, { id: number; name: string }>();
    findById(id: number) {
        return this.users.get(id) || null;
    }
    save(user: { id: number; name: string }) {
        this.users.set(user.id, user);
    }
}

// 3. Mock (모크): 호출 여부와 횟수를 기록하여 '행위' 검증
export class UserRepoMock implements UserRepository {
    public saveCalledCount = 0;
    public lastSavedUser: any = null;

    findById(id: number) { return null; }
    save(user: { id: number; name: string }) {
        this.saveCalledCount++;
        this.lastSavedUser = user;
    }
}
