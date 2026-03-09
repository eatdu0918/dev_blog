/**
 * 기능 중심의 평면적인 코드와 아키텍처가 적용된 구조적인 코드를 비교하는 예제
 */

// 1. [Trouble] 모든 로직이 하나의 함수에 복잡하게 얽힌 방식
export interface User {
    email: string;
    name: string;
}

export async function registerUserMessy(email: string, name: string): Promise<User> {
    // 벨리데이션
    if (!email.includes('@')) {
        throw new Error('Invalid email format');
    }

    // 중복 체크 (DB 모킹 가정)
    if (email === 'exists@example.com') {
        throw new Error('User already exists');
    }

    // 저장 로직 (DB 모킹 가정)
    const newUser = { email, name };
    console.log(`Saving user: ${newUser.email}`);

    // 환영 메일 발송 로직 (외부 API 모킹 가정)
    console.log(`Sending welcome email to ${email}`);

    return newUser;
}

// 2. [Solution] 아키텍처적 사고가 반영된 계층화된 방식
// 각 책임을 분리하여 변화에 유연하게 대응할 수 있도록 설계

// 도메인 엔티티 (가장 순수한 핵심 로직)
export class UserEntity {
    constructor(public readonly email: string, public readonly name: string) {
        this.validateEmail();
    }

    private validateEmail() {
        if (!this.email.includes('@')) {
            throw new Error('Invalid User: email format error');
        }
    }
}

// 인터페이스 (추상화)
export interface UserRepository {
    save(user: UserEntity): Promise<void>;
    findByEmail(email: string): Promise<UserEntity | null>;
}

export interface EmailService {
    sendWelcome(email: string): Promise<void>;
}

// 유스케이스 (도메인과 외부 세계를 연결하는 비즈니스 로직)
export class RegisterUserUseCase {
    constructor(
        private userRepository: UserRepository,
        private emailService: EmailService
    ) { }

    async execute(email: string, name: string): Promise<UserEntity> {
        const user = new UserEntity(email, name);

        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            throw new Error('User already exists');
        }

        await this.userRepository.save(user);
        await this.emailService.sendWelcome(user.email);

        return user;
    }
}
