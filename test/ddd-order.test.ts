import { describe, it, expect } from 'vitest';
import { Order, Money, Address, OrderStatus } from '../src/examples/ddd-order-example';

describe('DDD Order Aggregate Test', () => {
  const sampleAddress = new Address('Seoul', 'Gangnam-daero', '12345');
  const sampleMoney = new Money(50000);

  it('Money Value Object는 속성이 같으면 동등성을 보장해야 한다', () => {
    const m1 = new Money(1000, 'KRW');
    const m2 = new Money(1000, 'KRW');
    const m3 = new Money(2000, 'KRW');

    expect(m1.equals(m2)).toBe(true);
    expect(m1.equals(m3)).toBe(false);
  });

  it('Order 엔티티는 초기 상태가 PENDING이어야 한다', () => {
    const order = new Order('ORD-001', sampleMoney, sampleAddress);
    expect(order.status).toBe(OrderStatus.PENDING);
  });

  it('대기 중인 주문은 배송 상태로 변경될 수 있다', () => {
    const order = new Order('ORD-001', sampleMoney, sampleAddress);
    order.ship();
    expect(order.status).toBe(OrderStatus.SHIPPED);
  });

  it('이미 배송된 주문은 취소할 수 없으며 에러를 발생시켜야 한다', () => {
    const order = new Order('ORD-001', sampleMoney, sampleAddress);
    order.ship();
    
    expect(() => order.cancel()).toThrow('이미 배송된 주문은 취소할 수 없습니다.');
  });

  it('취소된 주문의 상태는 CANCELLED여야 한다', () => {
    const order = new Order('ORD-001', sampleMoney, sampleAddress);
    order.cancel();
    expect(order.status).toBe(OrderStatus.CANCELLED);
  });
});
