---
title: "분산 환경의 난제: 선착순 쿠폰 발급과 동시성 제어"
date: "2026-03-16"
description: "MSA 구조에서 수천 명의 사용자가 동시에 쿠폰을 요청할 때 발생할 수 있는 데이터 정합성 문제를 분석하고 해결책을 모색한 기록입니다."
tags: ["MSA", "Redis"]
---

이커머스 시스템에서 '한정 수량 쿠폰 발급'은 기술적으로 매우 흥미로우면서도 까다로운 주제입니다. 서비스가 하나이고 사용자가 적다면 단순한 DB 트랜잭션으로 충분하겠지만, MSA 환경에서 여러 대의 서버 인스턴스가 동시에 돌아가는 상황이라면 이야기가 달라집니다.

이번 프로젝트의 `discount-service`를 구현하며, 1,000장 한정 쿠폰이 1,010장 발급되는 불상사를 막기 위해 고민했던 동시성 제어 전략을 정리해 보았습니다.

## 왜 DB 트랜잭션만으로는 부족한가?

흔히 사용하는 `Transactional` 어노테이션은 단일 인스턴스 내의 데이터 무결성은 보장해주지만, 여러 요청이 '거의 동시에' 수량 확인 로직을 통과해버리는 상황(Race Condition)을 완전히 막지는 못합니다.

![Distributed Lock Coupon System](/public/images/distributed_lock_coupon_system.png)

위 그림처럼 세 개의 요청이 동시에 남은 수량이 1개인 것을 확인하고 발급 로직을 수행하면, 결과적으로 수량은 마이너스가 되거나 정해진 개수보다 더 많이 발급될 수 있습니다. 

## 해결책: 분산 락(Distributed Lock) 도입

서버가 여러 대인 분산 환경에서는 공통된 저장소를 활용한 '락'이 필요합니다. 이번 프로젝트에서는 성능과 편의성을 고려해 **Redis** 기반의 분산 락을 고민해 보았습니다.

1. **획득**: 클라이언트는 쿠폰 발급 전 Redis에 특정 키(예: `lock:coupon:1`)에 대한 권한을 요청합니다.
2. **검증 및 차감**: 락을 획득한 단 하나의 요청만 DB에서 남은 수량을 확인하고 차감합니다.
3. **해제**: 작업이 끝나면 락을 반납하여 다음 요청이 처리될 수 있도록 합니다.

물론 DB 수준에서 `SELECT ... FOR UPDATE`와 같은 **비관적 락(Pessimistic Lock)**을 사용할 수도 있지만, 트래픽이 몰리는 쿠폰 발급 특성상 DB 부하를 줄이기 위해 Redis 활용이 더 유리할 수 있다는 점을 배웠습니다.

## 동시성 제어 로직 시뮬레이션

간단한 테스트 코드를 통해 동시성 문제가 발생하는 상황과 이를 제어했을 때의 차이를 시뮬레이션해 보았습니다.

```typescript
// test/coupon-concurrency.test.ts
import { describe, it, expect } from 'vitest';

class CouponService {
  private stock = 10;
  private lock = false;

  // 락이 없는 위험한 발급 로직
  async claimUnsafe() {
    if (this.stock > 0) {
      // 수량 확인과 차감 사이에 짧은 딜레이 가정 (Race Condition 유발)
      await new Promise(res => setTimeout(res, 10));
      this.stock--;
      return true;
    }
    return false;
  }

  // 단순화된 분산 락 로직 기반 발급
  async claimWithLock() {
    while (this.lock) { // 락 획득 대기
      await new Promise(res => setTimeout(res, 1));
    }
    
    this.lock = true;
    try {
      if (this.stock > 0) {
        this.stock--;
        return true;
      }
      return false;
    } finally {
      this.lock = false;
    }
  }
}

describe('Coupon Issuance Concurrency', () => {
  it('락이 없으면 정해진 수량보다 더 많이 발급될 수 있다', async () => {
    const service = new CouponService();
    // 20명이 동시에 10개의 쿠폰에 접근
    const results = await Promise.all(Array.from({ length: 20 }).map(() => service.claimUnsafe()));
    const successCount = results.filter(r => r).length;
    
    // 10개만 있어야 하는데 동시성 이슈로 더 많이 발급될 가능성 높음
    expect(successCount).toBeGreaterThan(10); 
  });
});
```

## 마치며

"코드 한 줄로 해결되겠지" 싶었던 동시성 제어는 예상보다 훨씬 깊은 인프라적 이해를 요구했습니다. 특히 실제 운영 환경에서는 Redis의 가용성, 락의 타임아웃 설정 등 고려해야 할 변수가 무수히 많다는 것을 알게 되었습니다. 단순히 기능의 유무를 넘어, 대규모 트래픽 속에서도 데이터의 '숫자' 하나가 틀리지 않게 보장하는 것이 백엔드 개발자의 진정한 역량임을 깨닫는 계기가 되었습니다.
