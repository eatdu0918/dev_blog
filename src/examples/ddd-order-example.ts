/**
 * Domain-Driven Design (DDD) 탐색기: 주문 도메인 예제
 * 
 * 이 예제는 검색을 통해 학습한 DDD의 핵심 전술적 패턴들(Entity, Value Object, Aggregate)을
 * 코드로 구현해 본 결과물입니다.
 */

/**
 * [Value Object] Money
 * - 식별자가 없으며, 속성이 같으면 같은 객체로 취급합니다.
 * - 불변성(Immutability)을 유지하며 비즈니스 연산을 포함합니다.
 */
export class Money {
  constructor(public readonly amount: number, public readonly currency: string = 'KRW') {
    if (amount < 0) throw new Error('금액은 0보다 작을 수 없습니다.');
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('통화가 일치하지 않습니다.');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

/**
 * [Value Object] Address
 * - 단순 데이터 조항이 아닌 도메인 개념으로서의 주소입니다.
 */
export class Address {
  constructor(
    public readonly city: string,
    public readonly street: string,
    public readonly zipCode: string
  ) {}
}

/**
 * [Entity / Aggregate Root] Order
 * - 고유한 식별자(id)를 가지며 생명주기에 따라 상태가 변합니다.
 * - Aggregate의 진입점 역할을 하며 내부 객체들의 일관성을 책임집니다.
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
  CANCELLED = 'CANCELLED'
}

export class Order {
  private _status: OrderStatus = OrderStatus.PENDING;

  constructor(
    public readonly id: string,
    private _totalPrice: Money,
    private _shippingAddress: Address
  ) {}

  get status(): OrderStatus {
    return this._status;
  }

  get totalPrice(): Money {
    return this._totalPrice;
  }

  /**
   * 도메인 비즈니스 로직: 배송 시작
   * - 상태 전이 규칙을 캡슐화합니다.
   */
  ship(): void {
    if (this._status !== OrderStatus.PENDING) {
      throw new Error('대기 중인 주문만 배송할 수 있습니다.');
    }
    this._status = OrderStatus.SHIPPED;
  }

  /**
   * 도메인 비즈니스 로직: 주문 취소
   */
  cancel(): void {
    if (this._status === OrderStatus.SHIPPED) {
      throw new Error('이미 배송된 주문은 취소할 수 없습니다.');
    }
    this._status = OrderStatus.CANCELLED;
  }
}
