---
title: "Spring @Transactional의 함정: 전파 속성과 격리 수준의 실전 이해"
description: "맹목적인 로직 롤백을 넘어, 개발자가 직접 제어해야 할 트랜잭션의 생명주기와 동시성 이슈(Lost Update) 방어 전략을 다룹니다."
date: "2026-02-27"
tags: ["Spring", "Backend"]
---

# Spring @Transactional의 함정: 전파 속성과 격리 수준의 실전 이해

초보 시절, 메서드 선언부에 `@Transactional` 하나만 붙여주면 데이터베이스 롤백이 완벽하게 알아서 거미줄처럼 묶인다고 믿었다. 마치 스프링 프레임워크가 부려주는 은총의 마법처럼 보였다. 

하지만 실무 서버가 거대해지고 수십 개의 메서드가 꼬리를 물고 호출되는 상황, 그리고 엄청난 트래픽이 동시 다발적으로 하나의 데이터를 수정하려 드는 상황을 맞닥뜨리면서 그 마법은 곧 재앙으로 변했다.

"트랜잭션이 언제 새로 열리고, 언제 기존 것에 합류하는가?"
"두 명의 유저가 동시에 같은 포인트를 차감하면 왜 한 명의 차감 내역이 덮어씌워져 날아가는가(Lost Update)?"

오늘은 백엔드 개발을 하며 반드시 짚고 넘어가야 할, `@Transactional` 이면의 '전파 속성(Propagation)'과 '격리 수준(Isolation)'에 대한 실전 경험을 꺼내어 본다.

---

## 1. 맹목적인 REQUIRES의 함정 (Propagation)

Spring `@Transactional`의 기본 전파 속성은 `Propagation.REQUIRED`다. 쉽게 말해 "진행 중인 트랜잭션이 있으면 거기에 끼어들고, 없으면 새로 만든다"는 뜻이다.

주기적으로 회원들의 등급을 평가하고 상태를 업데이트하는 스케줄러 로직이 있다고 가정해 보자.

```java
@Transactional // <- 가장 상위에서 열린 거대한 트랜잭션
public void updateAllMembersGrades(List<Member> members) {
    for (Member member : members) {
        try {
            memberService.updateGrade(member); // 내부적으로 @Transactional이 붙어있음
        } catch (Exception e) {
            log.error("등급 업데이트 실패 (Member ID: {})", member.getId());
            // 한 명이 실패해도 멈추지 않고, 다음 회원을 계속 업데이트 하려는 의도
        }
    }
}
```

개발자의 의도는 완벽했다. "100명의 회원 중 1명이 에러 나더라도 try-catch로 잡았으니, 나머지 99명은 무사히 커밋되겠지?" 

**결과는 처참했다. 1명이라도 실패하면 100명 전체가 롤백(Rollback)되어 버린다.**

### 왜 이런 일이 발생했을까?
`memberService.updateGrade`에 붙어있는 트랜잭션은 기본값인 `REQUIRED`로 동작했다. 
즉, 바깥 인터페이스(`updateAllMembersGrades`)가 열어둔 '거대한 하나의 트랜잭션'에 조용히 편승한 것이다. 내부 트랜잭션에서 예외가 발생해 롤백 마킹(`Rollback-only`)이 찍히는 순간, 외부에서 아무리 try-catch로 예외를 삼켜봤자 최종 커밋 시점에는 "이미 롤백하기로 도장 찍혔어" 라며 `UnexpectedRollbackException`을 던져버린다.

### 해결책: 로그는 로그답게, REQUIRES_NEW
독립적인 작업 단위, 혹은 메인 비즈니스 로직이 실패하더라도 "실패 이력(Log)만큼은 반드시 DB에 기록으로 남겨둬야 하는" 상황이라면, 트랜잭션의 끈을 과감하게 잘라내야 한다.

```java
// updateGrade 메서드 내부
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void updateGrade(Member member) {
    // 이 메서드가 실행될 땐, 기존 트랜잭션을 잠시 멈춤(Suspend) 상태로 두고
    // 완전히 독립적인 새로운 물리 트랜잭션을 생성한다.
}
```

`REQUIRES_NEW`를 사용하면 내부 작업이 실패해서 롤백되더라도, 외부의 거대한 트랜잭션 진행에는 영향을 주지 않는다. (물론 성능상 Connection을 두 개 물고 있어야 하므로 남용은 금물이다.)

---

## 2. 동시성 이슈: 내 돈 내놔 (Isolation)

전파 속성으로 생명주기를 통제했다면, 이번엔 '동시 접근(Concurrency)'의 제어다.
이커머스 서비스에서 재고를 차감하거나 포인트를 깎는 로직을 생각해보자.

```java
@Transactional
public void deductPoint(Long memberId, int amount) {
    Member member = memberRepository.findById(memberId);
    member.setPoint(member.getPoint() - amount);
    // 더티 체킹으로 커밋 시점 Update 쿼리 날아감
}
```

A라는 유저가 동시에 웹과 모바일 앱에서 5,000원씩 결제(포인트 차감)를 따닥! 하고 눌렀다.
A의 원래 포인트는 10,000원. 
웹(Thread 1)과 모바일(Thread 2)이 0.001초 차이로 `findById`를 수행했다 치자.
두 스레드의 메모리에 올라온 `member` 객체의 포인트는 둘 다 10,000원이다.

Thread 1: 10000 - 5000 = 5000원 (DB에 5000원 업데이트)
Thread 2: 10000 - 5000 = 5000원 (DB에 5000원 업데이트)

어? 분명히 5,000점씩 두 번 나갔는데 DB에는 5,000점만 깎인 채로 5,000점이 남아있다. 이를 갱신 손실, 즉 **Lost Update**라 부른다.

### 데이터베이스 격리 수준(Isolation Level)의 한계
일반적인 RDBMS(MySQL 등)의 기본 격리 수준은 `READ_COMMITTED`다. (MySQL innoDb는 `REPEATABLE_READ`). 하지만 이 기본 격리 수준들은 다른 트랜잭션이 '수정하고 있는 중간'의 데이터(Dirty Read)나 '수정이 반영된 이후'의 데이터 일관성을 막아줄 뿐, 두 트랜잭션이 '동시에 읽어와서 각자 업데이트를 덮어씌우는' 행위를 근본적으로 막아주진 못한다.

### 어떻게 방어할 것인가?
우리는 여기서 비즈니스 중요도에 따라 락(Lock)의 수준을 결정해야 한다.

**1. Pessimistic Lock (비관적 락 / 배타 락)**
데이터베이스 자체의 `SELECT ... FOR UPDATE` 구문을 활용해, 내가 수정할 Row 자체에 물리적인 자물쇠를 걸어버린다.
- 장점: 동시성 충돌이 빈번할 때 가장 확실한 데이터 무결성을 보장한다.
- 단점: 자물쇠를 얻기 위해 대기하는 시간이 길어져 시스템 전체의 데드락(Deadlock)이나 성능 저하를 부를 수 있다. 결제 시스템의 계좌 잔액 차감 같은 경우에 적합.

**2. Optimistic Lock (낙관적 락)**
`@Version` 어노테이션 같은 버저닝(Versioning) 개념을 엔티티에 도입해 충돌을 감지한다. 물리적 자물쇠는 없다.
- 장점: Lock으로 인한 성능 비용이 매우 적다.
- 단점: 충돌이 발생했을 때 버전을 확인하고, 예외(`ObjectOptimisticLockingFailureException`)가 터지면 개발자가 직접 '재시도(Retry)' 로직을 짜서 후처리를 해줘야 한다. 자주 충돌이 나지 않는 게시글 수정 등에 적합.

---

## 맺으며

트랜잭션(Transaction)은 결국 이진적(A(C)ID)이다. '전부 성공'하거나 '전부 실패'하거나. 

하지만 수많은 클라이언트가 밀려드는 실무 환경에서는 이 이분법 사이의 정밀한 조율이 필요하다. 
어디서부터 어디까지를 하나의 원자(Atomic) 단위로 묶을 것인지, 그리고 동일한 자원을 향해 달려드는 동시 요청을 어느 수준에서 차단하고 통제할 것인지는 오롯이 도메인을 설계하는 개발자의 판단에 달려있다.

단순한 어노테이션 사용자를 넘어 트랜잭션의 흐름을 짚어보는 것, 그것이 더 나은 개발자로 성장하기 위한 필수 관문일 것이다.
