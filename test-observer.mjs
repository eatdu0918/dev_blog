// test-observer.mjs
class Store {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = [];
  }

  // 상태 변화를 구독(Subscribe)
  subscribe(listener) {
    this.listeners.push(listener);
    // 구독 취소(Unsubscribe) 함수를 반환
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // 상태 변경 및 발행(Publish)
  setState(newState) {
    this.state = { ...this.state, ...newState };
    // 상태가 변경될 때마다 등록된 모든 리스너에게 알림
    this.listeners.forEach((listener) => listener(this.state));
  }

  getState() {
    return this.state;
  }
}

// 스토어 생성
const store = new Store({ count: 0 });

// 첫 번째 구독자: 콘솔 출력 담당
store.subscribe((state) => {
  console.log(`[Logger] 상태가 업데이트 되었습니다: count = ${state.count}`);
});

// 두 번째 구독자: 특정 조건에만 반응
const unsubscribeAnalytics = store.subscribe((state) => {
  if (state.count >= 3) {
    console.log(`[Analytics] count가 3 이상이 되었습니다. 이벤트 전송!`);
    // 한번 호출된 후 스스로 구독 취소
    unsubscribeAnalytics();
  }
});

// 테스트: 상태 변경 발생
console.log('--- 1차 증가 ---');
store.setState({ count: store.getState().count + 1 });

console.log('--- 2차 증가 ---');
store.setState({ count: store.getState().count + 1 });

console.log('--- 3차 증가 ---');
store.setState({ count: store.getState().count + 1 });

console.log('--- 4차 증가 ---');
// Analytics는 더 이상 호출되지 않아야 함
store.setState({ count: store.getState().count + 1 });
