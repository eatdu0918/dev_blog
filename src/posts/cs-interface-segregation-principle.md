---
published: true
title: '인터페이스 분리 원칙(ISP): 필요 이상의 의존성 걷어내기'
date: '2026-03-03'
categories: ['Programming', 'CS']
---

# 인터페이스 분리 원칙(ISP): 필요 이상의 의존성 걷어내기

기능이 풍부한 인터페이스가 좋은 설계라고 믿었던 때가 있었습니다. 하지만 프로젝트가 커질수록, 그 '풍부한' 인터페이스는 오히려 구현체들에게는 무거운 짐이 된다는 것을 깨달았습니다.

어느 날 단일 기능만 필요한 클래스를 만들려는데, 사용하지도 않을 수십 개의 메서드를 빈 칸으로 채워 넣거나 예외를 던지도록 구현하며 느꼈던 당혹감이 **인터페이스 분리 원칙(ISP, Interface Segregation Principle)**을 깊이 파고들게 된 계기가 되었습니다.

---

## 1. 인터페이스는 클라이언트의 요구에 맞게 '최소한'이어야 한다

ISP의 핵심은 단순합니다. **"클라이언트는 자신이 사용하지 않는 메서드에 의존하도록 강제되어서는 안 된다"**는 것입니다.

범용 인터페이스(Fat Interface) 하나를 두고 여러 곳에서 상속받게 하는 것보다, 클라이언트의 목적에 맞게 구체적으로 쪼개진 여러 개의 인터페이스가 훨씬 유연하고 안전합니다.

![인터페이스 분리 원칙 개념](/images/interface_segregation_principle_concept.png)

위 그림처럼, 모든 기능을 다 담고 있는 무거운 인터페이스 대신, 각 장비가 실제로 필요한 기능만 담은 인터페이스를 제공해야 시스템의 결합도를 낮출 수 있습니다.

---

## 2. 실전 예제: 만능 프린터의 저주

과거에 제가 겪었던 상황을 단순화한 TypeScript 예제입니다.

### AS-IS: 비대해진 인터페이스 (Fat Interface)

```typescript
interface MultiFunctionDevice {
  print(): void;
  scan(): void;
  fax(): void;
}

// 구형 프린터는 인쇄만 가능한데, 인터페이스 때문에 스캔과 팩스 메서드까지 구현해야 합니다.
class OldPrinter implements MultiFunctionDevice {
  print() {
    console.log('인쇄 중...');
  }

  scan() {
    // 지원하지 않으므로 에러를 던지거나 빈 메서드로 둠 -> ISP 위반!
    throw new Error('스캔 기능을 지원하지 않습니다.');
  }

  fax() {
    throw new Error('팩스 기능을 지원하지 않습니다.');
  }
}
```

이렇게 설계하면 `OldPrinter`를 사용하는 클라이언트는 `scan()`이나 `fax()`가 동작할 것으로 오해할 수 있으며, 불필요한 의존성 때문에 인터페이스가 변경될 때마다 아무 상관 없는 `OldPrinter`까지 영향을 받게 됩니다.

### TO-BE: ISP 적용 후 (Segregated Interfaces)

```typescript
interface Printer {
  print(): void;
}

interface Scanner {
  scan(): void;
}

interface Fax {
  fax(): void;
}

// 이제 구형 프린터는 필요한 Printer 인터페이스만 구현합니다.
class SimplePrinter implements Printer {
  print() {
    console.log('단순 인쇄 중...');
  }
}

// 최신식 복합기는 여러 인터페이스를 조합(Composition)하여 구현합니다.
class ProfessionalCopier implements Printer, Scanner {
  print() {
    console.log('고성능 인쇄...');
  }

  scan() {
    console.log('고성능 스캔...');
  }
}
```

이렇게 인터페이스를 분리하면 각 클래스는 자신이 **정말로 수행할 수 있는 역할**에만 집중하게 됩니다.

---

## 3. 깨달음과 성장

ISP를 적용해보며 깨달은 점은, 인터페이스가 곧 **'계약(Contract)'**이라는 사실입니다. 클라이언트에게 "이것을 제공하겠다"고 약속하는 문서와 같습니다. 

지키지 못할 약속(사용하지 않는 메서드)이 가득한 계약서는 결국 시스템의 신뢰를 무너뜨립니다. 인터페이스를 잘게 쪼개는 것은 단순히 파일을 늘리는 작업이 아니라, 시스템의 응집도를 높이고 변화에 유연하게 대응할 수 있는 기초를 다지는 과정임을 배웠습니다.

---

## 회고

그동안 인터페이스를 설계할 때 '나중에 이것도 필요하겠지'라는 생각으로 미리 기능을 추가하곤 했습니다. 하지만 그것이 오히려 독이 된다는 것을 알게 되었습니다. 이제는 인터페이스를 만들 때 "이 인터페이스를 사용하는 클라이언트가 이 모든 메서드를 정말로 필요로 하는가?"를 가장 먼저 자문해 보게 되었습니다.
