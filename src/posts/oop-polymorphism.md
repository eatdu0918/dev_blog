---
published: true
title: '다형성(Polymorphism): 하나의 인터페이스, 다양한 얼굴'
date: '2026-03-05'
categories: ['Programming', 'CS', 'OOP']
---

# 다형성(Polymorphism): 하나의 인터페이스, 다양한 얼굴

코드 곳곳에 널려 있는 `if/else`나 `switch/case` 문은 처음에는 직관적이지만, 기능이 추가될수록 거대한 스파게티가 되어 우리를 괴롭힙니다. 새로운 타입이 추가될 때마다 모든 조건문을 찾아다니며 코드를 수정해야 한다면, 그 시스템은 변화에 매우 취약한 상태라고 할 수 있습니다.

**다형성(Polymorphism)**은 이러한 분기문의 지옥에서 우리를 구원해 줄 핵심 개념입니다.

![다형성 시각화](/public/images/oop-polymorphism.png)

## 역할과 구현을 분리하기

다형성은 한 가지 타입의 식별자로 여러 형태의 객체를 참조할 수 있는 능력을 말합니다. 프로그래머는 구체적인 클래스가 무엇인지 몰라도, 그 객체가 수행할 '역할'만 알고 있다면 동일한 방식으로 대화할 수 있습니다.

예를 들어, 모든 파일 저장소는 `upload()`라는 행위를 할 수 있습니다. AWS S3이든 로컬 서버든 구름 저장소이든, 우리는 그저 "업로드해라"라고 명령할 뿐입니다. 구체적으로 어디에 어떻게 저장할지는 각 객체가 스스로 결정합니다.

```typescript
interface StorageProvider {
  upload(filename: string): void;
}

class S3Storage implements StorageProvider {
  upload(filename: string) { console.log(`${filename}을 S3에 업로드 완료`); }
}

class LocalStorage implements StorageProvider {
  upload(filename: string) { console.log(`${filename}을 로컬 서버에 저장 완료`); }
}

// 다형성의 힘: 구체적인 타입을 몰라도 일괄 처리 가능
const storages: StorageProvider[] = [new S3Storage(), new LocalStorage()];
storages.forEach(storage => storage.upload("image.png"));
```

## 실전 예제: 결제 시스템의 유연한 확장

다양한 결제 수단(신용카드, 카카오페이, 페이코 등)을 지원해야 하는 커머스 시스템을 상상해 보세요. 다형성이 없다면 결제 로직은 수많은 `if` 문으로 도배될 것입니다.

다형성을 도입하면 새로운 결제 수단이 추가되어도 기존의 주문 처리 로직은 단 한 줄도 수정할 필요가 없습니다.

```typescript
interface PaymentProcessor {
  pay(amount: number): boolean;
}

class CardPayment implements PaymentProcessor {
  pay(amount: number) {
    console.log(`${amount}원 카드 결제 승인`);
    return true;
  }
}

class PointPayment implements PaymentProcessor {
  pay(amount: number) {
    console.log(`${amount}원 포인트 차감 완료`);
    return true;
  }
}

class OrderManager {
  // 특정 결제 수단이 아닌, '역할(인터페이스)'에 의존함
  processOrder(processor: PaymentProcessor, amount: number) {
    if (processor.pay(amount)) {
      console.log("주문 처리가 완료되었습니다.");
    }
  }
}
```

## 학습을 통해 깨달은 점

다형성은 단순히 코드를 깔끔하게 만드는 기술을 넘어, **'클라이언트 코드의 변경 없이 서버 구현을 교체'**할 수 있게 해주는 객체 지향의 꽃이라는 점을 깨달았습니다. 

다형성을 제대로 활용하기 위해서는 추상화와 인터페이스 설계 능력이 뒷받침되어야 한다는 사실도 알게 되었습니다. "객체에게 명령을 내리고, 어떻게 할지는 객체에게 맡긴다"는 이 원칙이 좋은 설계를 향한 가장 중요한 이정표가 되어주고 있습니다.
