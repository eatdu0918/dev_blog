import { describe, it, expect, beforeEach } from 'vitest';

// MSA 환경에서의 이벤트 기반 멱등성 처리 시뮬레이션
class EventConsumer {
  private processedEvents = new Set<string>(); // 실무에서는 DB 테이블 (processed_events)

  async handleEvent(event: { eventId: string; type: string; data: any }) {
    // 1. 중복성 체크 (isDuplicate)
    if (this.processedEvents.has(event.eventId)) {
      console.warn(`[중복 이벤트 무시] eventId: ${event.eventId}`);
      return { success: true, duplicated: true };
    }

    // 2. 비즈니스 로직 수행 (예: 결제 완료 처리)
    console.log(`[이벤트 처리 중] type: ${event.type}, data:`, event.data);
    
    // 3. 처리된 이벤트 ID 기록 (markProcessed)
    this.processedEvents.add(event.eventId);
    
    return { success: true, duplicated: false };
  }
}

describe('MSA Event Idempotency (Idempotent Consumer Pattern)', () => {
  let consumer: EventConsumer;

  beforeEach(() => {
    consumer = new EventConsumer();
  });

  it('동일한 Event ID가 들어오면 두 번째부터는 무시해야 한다', async () => {
    const event = {
      eventId: 'evt_saga_payment_001',
      type: 'order-created',
      data: { orderId: 101, amount: 50000 }
    };

    // 첫 번째 처리
    const firstResult = await consumer.handleEvent(event);
    expect(firstResult.duplicated).toBe(false);

    // 동일한 이벤트 재입입 (Kafka 등의 Retry 상황 가정)
    const secondResult = await consumer.handleEvent(event);
    expect(secondResult.duplicated).toBe(true);
  });

  it('서로 다른 Event ID는 정상적으로 각각 처리되어야 한다', async () => {
    const event1 = { eventId: 'evt_1', type: 'order-created', data: {} };
    const event2 = { eventId: 'evt_2', type: 'order-created', data: {} };

    const res1 = await consumer.handleEvent(event1);
    const res2 = await consumer.handleEvent(event2);

    expect(res1.duplicated).toBe(false);
    expect(res2.duplicated).toBe(false);
  });
});
