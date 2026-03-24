import { describe, it, expect } from 'vitest';
import { negotiateVersion } from '../src/examples/federation-resolution';

describe('Module Federation 버전 협상(Dependency Negotiation) 시뮬레이션', () => {
  const mockScope = {
    react: {
      '18.2.0': { loaded: false },
      '18.1.0': { loaded: false },
      '17.0.2': { loaded: false },
    },
    lodash: {
      '4.17.21': { loaded: false },
    },
  };

  it('singleton: true 설정 시 버전 범위와 상관없이 최상위 버전을 선택함', () => {
    // 17.0.0을 요구해도 싱글톤이라면 전역에서 최상위인 18.2.0을 반환 (이론적)
    const selected = negotiateVersion(mockScope, 'react', '^17.0.0', { singleton: true });
    expect(selected).toBe('18.2.0');
  });

  it('일반 설정 시 요구된 범위 내에서 가장 최신 버전을 선택함', () => {
    const selected = negotiateVersion(mockScope, 'react', '^17.0.0', { singleton: false });
    expect(selected).toBe('17.0.2');
  });

  it('일반 설정 시 상위 메이저 버전과의 호환성을 보장하지 않음', () => {
    const selected = negotiateVersion(mockScope, 'react', '^18.0.0', { singleton: false });
    expect(selected).toBe('18.2.0');
  });

  it('호환되는 버전이 전혀 없을 시 사용자 에러를 발생시킴', () => {
    expect(() => negotiateVersion(mockScope, 'react', '^16.0.0')).toThrow(/Incompatible version/);
  });
});
