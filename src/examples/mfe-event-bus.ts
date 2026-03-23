/**
 * Micro Frontends 애플리케이션 간 통신을 위한 간단한 이벤트 버스 구현체입니다.
 * 각 마이크로 앱은 독립적으로 배포되지만, 런타임에서 이 인터페이스를 통해 메시지를 주고받을 수 있습니다.
 */

type Callback = (data: any) => void;

class MicroFrontendEventBus {
  private events: { [key: string]: Callback[] } = {};

  /**
   * 이벤트를 구독합니다.
   * @param eventName 구독할 이벤트 이름
   * @param callback 이벤트 발생 시 실행될 콜백 함수
   */
  subscribe(eventName: string, callback: Callback): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  /**
   * 이벤트를 발행합니다.
   * @param eventName 발행할 이벤트 이름
   * @param data 전달할 데이터
   */
  publish(eventName: string, data: any): void {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * 구독을 해제합니다.
   * @param eventName 구독 해제할 이벤트 이름
   * @param callback 제거할 콜백 함수
   */
  unsubscribe(eventName: string, callback: Callback): void {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter((cb) => cb !== callback);
    }
  }

  /**
   * 특정 이벤트의 모든 구독을 초기화합니다 (테스트용).
   */
  clear(eventName?: string): void {
    if (eventName) {
      delete this.events[eventName];
    } else {
      this.events = {};
    }
  }
}

// 싱글톤 인스턴스로 관리하여 윈도우 객체 등을 통해 공유할 수 있는 구조를 제안합니다.
export const eventBus = new MicroFrontendEventBus();
