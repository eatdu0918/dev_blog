import { describe, it, expect } from 'vitest';
import { getThemeColor, updateThemeColor, increaseFontSize, resetToDefault } from '../src/examples/ramda-lenses-example';

describe('Ramda Lenses 학습 테스트', () => {
  const testState = {
    settings: {
      theme: {
        color: 'red',
        fontSize: 12
      },
      notifications: false
    }
  };

  it('R.view를 통해 깊은 경로의 값을 읽어야 한다', () => {
    expect(getThemeColor(testState as any)).toBe('red');
  });

  it('R.set을 통해 원본을 유지하며 값을 변경한 새 객체를 반환해야 한다', () => {
    const nextState = updateThemeColor('green', testState as any);
    
    expect(nextState.settings.theme.color).toBe('green');
    expect(testState.settings.theme.color).toBe('red'); // 원본 불변
  });

  it('R.over를 통해 기존 폰트 크기를 증가시켜야 한다', () => {
    const nextState = increaseFontSize(testState as any);
    expect(nextState.settings.theme.fontSize).toBe(14);
  });

  it('R.pipe와 연계하여 여러 렌즈 조작을 조합해야 한다', () => {
    const nextState = resetToDefault(testState as any);
    expect(nextState.settings.theme.color).toBe('white');
    expect(nextState.settings.theme.fontSize).toBe(16);
  });
});
