/**
 * src/examples/tdd-example.ts
 * 
 * TDD(Test Driven Development) 과정을 통해 작성된 비밀번호 유효성 검사기입니다.
 * 실패하는 테스트를 먼저 작성하고(Red), 통과시킨 뒤(Green), 코드를 개선하는(Refactor)
 * 사이클을 반복하며 설계되었습니다.
 */

export class PasswordValidator {
  /**
   * 비밀번호 유효성을 검사합니다.
   * 규칙:
   * 1. 8자 이상
   * 2. 숫자 포함
   * 3. 하나 이상의 대문자 포함
   */
  validate(password: string): boolean {
    if (password.length < 8) {
      return false;
    }

    const hasNumber = /\d/.test(password);
    if (!hasNumber) {
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    if (!hasUpperCase) {
      return false;
    }

    return true;
  }
}
