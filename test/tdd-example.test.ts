import { describe, it, expect } from 'vitest';
import { PasswordValidator } from '../src/examples/tdd-example';

describe('PasswordValidator (TDD 탐색)', () => {
  const validator = new PasswordValidator();

  it('비밀번호가 8자 미만이면 실패해야 합니다. (Red 단계에서의 고민)', () => {
    expect(validator.validate('short')).toBe(false);
  });

  it('비밀번호가 8자 이상이어도 숫자가 없으면 실패해야 합니다.', () => {
    expect(validator.validate('NoNumberText')).toBe(false);
  });

  it('대문자가 포함되어 있지 않으면 실패해야 합니다.', () => {
    expect(validator.validate('alllowercase123')).toBe(false);
  });

  it('모든 조건을 만족하면 성공해야 합니다. (Green 단계 달성)', () => {
    expect(validator.validate('StrongPass123')).toBe(true);
  });
});
