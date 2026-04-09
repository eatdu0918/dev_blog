import { describe, it, expect } from 'vitest';
import { isAdult } from './mutation-example';

describe('isAdult() - Mutation Testing Example', () => {
  /**
   * 이 테스트는 100% 코드 커버리지를 달성합니다.
   * 하지만 경계값(18)에 대한 검증이 누락되어 있어 뮤테이션 테스팅에서 'Survived' 결과가 나올 수 있습니다.
   */
  it('18세보다 많은 나이(20)에 대해 true를 반환해야 한다', () => {
    expect(isAdult(20)).toBe(true);
  });

  it('18세보다 적은 나이(15)에 대해 false를 반환해야 한다', () => {
    expect(isAdult(15)).toBe(false);
  });

  /**
   * 아래 테스트가 주석 처리되어 있거나 없다면, 
   * 'age >= 18'이 'age > 18'로 변이되었을 때 이 테스트 스위트는 통과하게 됩니다. (즉, 뮤턴트가 생존함)
   */
  // it('정확히 18세인 경우 true를 반환해야 한다', () => {
  //   expect(isAdult(18)).toBe(true);
  // });
});
