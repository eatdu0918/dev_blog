---
published: true
title: '계층별 추상화: 복잡함을 질서 있게 쌓아 올리기'
date: '2026-03-03'
categories: ['Programming', 'CS']
---

# 계층별 추상화: 복잡함을 질서 있게 쌓아 올리기

프로젝트 초기에는 모든 코드가 한 파일에 뭉쳐 있어도 문제가 없었습니다. 하지만 기능이 늘어날수록 UI 로직, 비즈니스 정책, 데이터 저장 로직이 뒤엉켜 스파게티가 되어가는 것을 목격했습니다. 

버그가 터졌을 때 그 원인이 DB 쿼리인지, API 요청 파싱인지, 아니면 계산 로직인지조차 분간하기 어려운 상황을 겪으며 **계층별 추상화(Layered Abstraction)**의 절실함을 깨달았습니다.

---

## 1. 수평적 관심사의 분리 (Layered Architecture)

계층별 추상화는 시스템의 책임을 수평적으로 나누는 것입니다. 각 계층은 자신에게 주어진 역할에만 집중하며, 바로 아래 계층에만 의존하는 **'질서 있는 의존성'**을 유지합니다.

1. **표현 계층 (Presentation Layer)**: 사용자 인터페이스(UI)나 API 요청을 처리합니다. 비즈니스 로직에는 관심이 없습니다.
2. **서비스 계층 (Service Layer)**: 애플리케이션의 핵심 비즈니스 정책을 구현합니다. 데이터가 DB에 저장되는지 파일에 저장되는지에는 무관심합니다.
3. **데이터 접근 계층 (Data Access Layer)**: 구체적인 영속성 기술(DB, SQL, NoSQL)을 다룹니다.

![계층별 추상화의 시각적 구조](/public/images/layered_abstraction_concept.png)

위 그림처럼 마치 층이 나뉜 건물이나 케이크처럼 설계를 쌓아 올리면, 각 층은 독립적으로 유지보수하고 교체할 수 있는 유연함을 얻게 됩니다.

---

## 2. 실전 예제: MVC 패턴으로 보는 계층화

과거에 제가 작업했던 전형적인 3계층 아키텍처 예제입니다.

### 표현 계층 (Controller) - "어떻게 보여줄 것인가?"

```typescript
class UserController {
  constructor(private userService: UserService) {}

  async onRegister(req: Request, res: Response) {
    try {
      // 1. 요청 데이터를 파싱하고 서비스에 위임합니다.
      const result = await this.userService.register(req.body);
      res.status(200).json(result);
    } catch (e: any) {
      // 2. HTTP 에러로 응답합니다.
      res.status(400).send(e.message);
    }
  }
}
```

### 서비스 계층 (Service) - "어떤 가치를 제공할 것인가?"

```typescript
class UserService {
  constructor(private userRepo: UserRepository) {}

  async register(data: any) {
    // 1. 비즈니스 정책 검증 (이메일 중복 체크 등)
    if (await this.userRepo.findByEmail(data.email)) {
       throw new Error('이미 가입된 이메일입니다.');
    }
    // 2. 비즈니스 도메인 로직 처리 후 데이터 저장 요청
    return await this.userRepo.save(data);
  }
}
```

### 데이터 접근 계층 (Repository) - "데이터를 어떻게 저장할 것인가?"

```typescript
class UserRepository {
  async save(user: any) {
    // 1. 구체적인 DB 연동 기술 사용 (예: MySQL 쿼리)
    return await db.insert('users', user);
  }
}
```

이렇게 계층을 나누면, 데이터베이스를 MySQL에서 PostgreSQL로 바꿔야 할 때 **서비스나 컨트롤러 코드는 단 한 줄도 건드리지 않고** 저장소 계층만 수정하면 됩니다.

---

## 3. 깨달음과 성장: 변화에 강한 구조 만들기

계층별 추상화는 단순히 폴더를 나누는 게 아니라, **'관심사의 분리(Separation of Concerns)'**를 달성하는 수단이었습니다. 계층화가 잘 된 코드베이스에서는 다음과 같은 이점을 누릴 수 있었습니다.

- **격리된 테스트**: 서비스 레이어 테스트를 위해 굳이 실제 DB를 띄울 필요 없이, 저장소 레이어를 모킹(Mocking)하여 순수 로직만 빠르게 테스트할 수 있습니다.
- **인지 부하 감소**: 한 번에 고려해야 할 지식의 범위를 한 레이어로 좁힐 수 있어 복잡한 문제를 푸는 데 훨씬 유리했습니다.

---

## 4. 회고

이전에는 "그냥 한 파일에 다 쓰면 더 편하지 않나?"라고 생각했습니다. 하지만 시스템이 커질수록 계층 없는 코드는 기술 부채로 돌아왔습니다. "나쁜 아키텍처는 처음에는 빠르지만 곧 죽음에 이르고, 좋은 아키텍처는 처음에는 느려 보이지만 결국 더 멀리 간다"는 말을 실감합니다. 이제는 어떤 프로젝트를 시작하든 최소한의 계층 구조를 먼저 세우는 것이 나보다 나중에 이 코드를 볼 누군가를 위한 최고의 배려임을 믿습니다.
