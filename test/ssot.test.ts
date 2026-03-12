import { describe, test, expect, beforeEach } from 'vitest';
import { UserStore, FragmentedStateComponent } from '../src/examples/ssot-example';

describe('SSoT Design Pattern Test', () => {
  beforeEach(() => {
    // 싱글톤 초기화 (테스트 간 간섭 방지)
    const store = UserStore.getInstance();
    store.setUser({ id: '1', name: 'Original Name', email: 'test@example.com' });
  });

  test('SSoT 스토어를 통해 모든 구독자가 최신 데이터를 유지해야 한다', () => {
    const store = UserStore.getInstance();
    
    let headerName = '';
    let mainContentName = '';

    // 헤더와 메인 컨텐츠가 스토어를 구독
    store.subscribe((user) => {
      headerName = user?.name || '';
    });
    store.subscribe((user) => {
      mainContentName = user?.name || '';
    });

    // 초깃값 확인
    expect(headerName).toBe('Original Name');
    expect(mainContentName).toBe('Original Name');

    // 스토어 데이터 변경
    store.updateName('New Name');

    // 별도의 업데이트 호출 없이도 모든 구독자가 동일한 값을 가짐 (SSoT의 힘)
    expect(headerName).toBe('New Name');
    expect(mainContentName).toBe('New Name');
  });

  test('데이터 소스가 파편화된 경우(Fragmented) 데이터 불일치가 발생할 수 있다', () => {
    const initialName = 'Initial';
    const componentA = new FragmentedStateComponent(initialName);
    const componentB = new FragmentedStateComponent(initialName);

    // A의 이름만 변경됨
    componentA.localName = 'Updated A';

    // B는 여전히 이전 값을 가지고 있음 (SSoT가 아님)
    expect(componentA.localName).not.toBe(componentB.localName);
    expect(componentB.localName).toBe(initialName);
  });
});
