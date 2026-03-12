/**
 * SSoT (Single Source of Truth) 예제
 * 
 * 여러 곳에서 쓰이는 데이터를 하나의 소스에서 관리하여 데이터 불일치 문제를 방지한다.
 */

export interface User {
  id: string;
  name: string;
  email: string;
}

// SSoT를 담당하는 스토어 클래스
export class UserStore {
  private static instance: UserStore;
  private user: User | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  private constructor() {}

  public static getInstance(): UserStore {
    if (!UserStore.instance) {
      UserStore.instance = new UserStore();
    }
    return UserStore.instance;
  }

  public setUser(user: User): void {
    this.user = user;
    this.notify();
  }

  public getUser(): User | null {
    return this.user;
  }

  public updateName(newName: string): void {
    if (this.user) {
      this.user = { ...this.user, name: newName };
      this.notify();
    }
  }

  public subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    // 현재 상태 즉시 전달
    listener(this.user);
    
    // 구독 해제 함수 반환
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.user));
  }
}

// 데이터 동기화 문제가 발생하는 상황 (나쁜 예시를 위한 시뮬레이션 코드)
export class FragmentedStateComponent {
  public localName: string = '';

  constructor(initialName: string) {
    this.localName = initialName;
  }

  // 외부에서 변경되어도 알 방법이 없음 (불일치 발생 위험)
  public syncManually(newName: string) {
    this.localName = newName;
  }
}
