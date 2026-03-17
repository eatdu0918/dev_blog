import * as R from 'ramda';

/**
 * Ramda Lenses 학습용 기초 예제 코드
 */

interface State {
  settings: {
    theme: {
      color: string;
      fontSize: number;
    };
    notifications: boolean;
  };
}

const initialState: State = {
  settings: {
    theme: {
      color: 'blue',
      fontSize: 14
    },
    notifications: true
  }
};

/**
 * 1. 렌즈 정의
 * 특정 경로에 대한 조준경을 미리 만들어둡니다.
 */
const colorLens = R.lensPath(['settings', 'theme', 'color']);
const fontSizeLens = R.lensPath(['settings', 'theme', 'fontSize']);

/**
 * 2. 렌즈 활용 API
 */

// 값을 읽어오는 함수 (Getter)
export const getThemeColor = (state: State) => R.view(colorLens, state);

// 값을 불변하게 설정하는 함수 (Setter)
export const updateThemeColor = (newColor: string, state: State) => 
  R.set(colorLens, newColor, state);

// 기존 값을 기반으로 계산/변형하는 함수 (Updater)
export const increaseFontSize = (state: State) => 
  R.over(fontSizeLens, R.add(2), state);

/**
 * 3. 렌즈의 재사용성
 * 렌즈는 독립적이므로 어떤 상태 객체든 동일한 구조를 가지면 적용 가능합니다.
 */
export const resetToDefault = (state: State) => {
  return R.pipe(
    R.set(colorLens, 'white'),
    R.set(fontSizeLens, 16)
  )(state);
};
