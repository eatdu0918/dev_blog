import { describe, it, expect, vi } from 'vitest';

abstract class BaseNotification {
  public logOutput: string[] = [];

  protected abstract sendLogic(msg: string): void;

  public send(message: string) {
    this.logOutput.push("START");
    this.sendLogic(message);
    this.logOutput.push("END");
  }
}

class EmailNotification extends BaseNotification {
  protected sendLogic(msg: string) {
    this.logOutput.push(`EMAIL: ${msg}`);
  }
}

describe('BaseNotification Inheritance Test', () => {
  it('should follow the common template defined in parent class', () => {
    const emailNoti = new EmailNotification();
    emailNoti.send("Test Message");

    // 자식 클래스가 부모의 템플릿 로직을 올바르게 수행하는지 검증
    expect(emailNoti.logOutput).toEqual([
      "START",
      "EMAIL: Test Message",
      "END"
    ]);
  });

  it('should be an instance of the parent class (Is-A relationship)', () => {
    const emailNoti = new EmailNotification();
    expect(emailNoti).toBeInstanceOf(BaseNotification);
  });
});
