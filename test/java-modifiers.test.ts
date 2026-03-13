import { describe, it, expect } from 'vitest';

/**
 * Java의 제어자 철학을 TypeScript로 시뮬레이션
 */
abstract class BaseService {
  // 1. static: 인스턴스가 아닌 클래스에 귀속 (공유 자산)
  static REQUEST_COUNT = 0;
  static readonly MAX_TIMEOUT = 5000;

  // 2. final: TypeScript에서는 readonly가 유사한 역할을 수행 (변경 불가능한 상수/필드)
  readonly serviceId: string;

  constructor(id: string) {
    this.serviceId = id;
  }

  // 3. abstract: 구현부가 없는 선언만 존재 (자식에게 구현 강제)
  abstract execute(): string;

  // 공통 로직
  process() {
    BaseService.REQUEST_COUNT++;
    return this.execute();
  }
}

class EmailService extends BaseService {
  execute() {
    return `Email [${this.serviceId}] sent.`;
  }
}

class SmsService extends BaseService {
  execute() {
    return `SMS [${this.serviceId}] sent.`;
  }
}

describe('Java Modifiers Simulation in TypeScript', () => {
  it('should demonstrate static behavior (shared state)', () => {
    // static 필드는 클래스 이름으로 접근하며 모든 인스턴스가 상태를 공유함
    const email = new EmailService("E1");
    const sms = new SmsService("S1");

    email.process();
    sms.process();

    expect(BaseService.REQUEST_COUNT).toBe(2);
  });

  it('should demonstrate final-like behavior (readonly)', () => {
    const service = new EmailService("SERVICE_XYZ");
    expect(service.serviceId).toBe("SERVICE_XYZ");
    
    // service.serviceId = "NEW_ID"; // TS 컴파일 에러 발생 (readonly)
  });

  it('should demonstrate abstract behavior (forced implementation)', () => {
    const email = new EmailService("E1");
    expect(email.execute()).toBe("Email [E1] sent.");
    
    // const base = new BaseService("B1"); // TS 컴파일 에러 발생 (Cannot create an instance of an abstract class)
  });
  
  it('should demonstrate static constants', () => {
    expect(BaseService.MAX_TIMEOUT).toBe(5000);
    // BaseService.MAX_TIMEOUT = 3000; // TS 컴파일 에러 발생 (static readonly)
  });
});
