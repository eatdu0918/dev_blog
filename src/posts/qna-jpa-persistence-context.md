---
published: true
type: 'qna'
level: 'mid'
title: "JPA의 영속성 컨텍스트가 무엇이고, dirty checking이 어떻게 동작하는지 설명해주세요."
date: '2026-04-26'
categories: ['JPA', 'Spring', 'Backend']
---

## Q1. 영속성 컨텍스트가 무엇인가요?

**A.** EntityManager가 관리하는 **1차 캐시이자 트랜잭션 단위 작업 공간**입니다. 영속 상태의 엔티티를 보관하고, 트랜잭션이 끝나는 시점에 변경 사항을 DB에 반영합니다.

엔티티가 영속 상태(persistent)가 되면 JPA는 **로딩 시점의 값을 별도 스냅샷으로 보관**해두고, flush 시점에 현재 값과 비교합니다.

---

## Q2. Dirty Checking은 어떻게 동작하나요?

**A.** 트랜잭션 커밋 직전 `flush()` 호출 시 영속 상태의 모든 엔티티에 대해 **스냅샷과 현재 값을 비교**해 차이가 있는 필드를 묶어 UPDATE를 발행합니다.

```java
// repository.save()를 다시 부르지 않아도
User user = userRepository.findById(id);
user.setName("kim"); // setter만으로 변경 감지 → UPDATE 자동
```

스냅샷이 곧 dirty checking의 메모리 비용입니다. 엔티티 수 × 필드 수만큼.

---

## Q3. 쓰기 지연(write-behind)이란 무엇인가요?

**A.** 영속화된 엔티티의 INSERT/UPDATE가 **즉시 발행되지 않고 쓰기 지연 SQL 저장소에 모였다가 flush 시점에 한꺼번에 나가는** 동작입니다.

장점:
- JDBC batch로 묶어 네트워크 왕복 감소.
- 동일 엔티티에 여러 변경이 있으면 한 UPDATE로 합쳐짐.
- 플러시 순서 최적화로 외래키 제약 충족.

---

## Q4. flush는 언제 트리거되나요?

**A.** 일반적으로 3가지 시점입니다.

1. **트랜잭션 커밋**.
2. **JPQL/Native 쿼리 실행 직전**: 영속 컨텍스트의 변경사항이 DB에 반영되어 있어야 쿼리 결과가 일관되기 때문.
3. **명시적 `em.flush()`**.

특히 JPQL 실행 전 자동 flush는 dirty checking과 자주 충돌하는 포인트입니다.

---

## Q5. 동일성 보장은 무엇인가요?

**A.** **같은 트랜잭션 안에서 같은 PK로 조회하면 1차 캐시에서 동일 인스턴스를 반환**합니다.

```java
User a = userRepository.findById(1L);
User b = userRepository.findById(1L);
a == b; // true
```

`==` 비교가 가능한 이유입니다. 1차 캐시는 PK 기준이라 JPQL로 조회하면 캐시 hit이 안 되고 매번 새 결과가 옵니다.

---

## Q6. 대량 업데이트에서 dirty checking이 왜 문제가 되나요?

**A.** **메모리 폭발 + 스냅샷 비교 비용**입니다.

수만 건을 setter로 갱신하면:
- 엔티티가 모두 영속 상태로 올라감.
- 각각 스냅샷 보관.
- flush 시 모두 비교.

해결:
- **`@Modifying` 벌크 쿼리**: `UPDATE Entity SET ...`로 1차 캐시 우회.
- 벌크 쿼리 후 **`entityManager.clear()`** 로 컨텍스트와 DB 동기화 명시적으로 끊기.
- batch insert/update는 `hibernate.jdbc.batch_size` 설정과 함께.

---

## Q7. 준영속(detached) 상태와 영속(persistent) 상태가 헷갈립니다.

**A.** **dirty checking이 일어나는지 여부**가 핵심입니다.

- **영속**: 영속성 컨텍스트가 관리. setter만으로 자동 UPDATE.
- **준영속**: 컨텍스트 밖. setter 해도 반영 안 됨.

자주 만나는 함정: OSIV 끄고 컨트롤러에서 받은 엔티티는 이미 준영속. 서비스 계층의 트랜잭션 안에서 **다시 조회**해 변경을 적용해야 dirty checking이 동작합니다.

---

## Q8. save()는 언제 명시적으로 호출하나요?

**A.** 두 가지 경우:

1. **신규 엔티티 생성**: `new User(...)` → 영속 상태로 만들려면 `save()`.
2. **준영속 엔티티 병합**: `merge()` 의미로 사용. 다만 merge는 새 인스턴스를 반환하므로 반환값을 받아야 함.

이미 영속 상태 엔티티는 `save()` 호출 없이 setter만으로 충분합니다.

---

## Q9. @DynamicUpdate는 언제 켜나요?

**A.** **컬럼이 매우 많고 변경 컬럼이 일부**일 때입니다.

기본은 변경 여부와 무관하게 모든 컬럼이 UPDATE에 포함됩니다. `@DynamicUpdate`는 변경된 컬럼만 포함시킵니다.

이득:
- UPDATE 문 사이즈 감소.
- 인덱스 영향 범위 축소(다른 컬럼이 인덱스에 있으면 SET이 없어도 인덱스 재계산 트리거되는 DB가 있음).

비용: 매 UPDATE마다 동적 SQL 생성 → JDBC PreparedStatement 캐시 효과 감소. 컬럼 50개 이상 + 일부만 자주 변경되는 경우에만 의미가 큽니다.
