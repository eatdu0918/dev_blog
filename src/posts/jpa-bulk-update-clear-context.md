---
title: "JPA 비영속 벌크 연산의 역습: 1차 캐시 불일치로 겪은 더티 리드(Dirty Read) 참사"
description: "아무 생각 없이 JPA 벌크 쿼리(UPDATE)를 때렸다가, 1차 캐시 미동기화로 인해 발생한 치명적인 데이터 불일치 버그를 추적한 회고입니다."
date: "2026-02-26"
tags: ["Java", "Spring", "JPA", "Backend", "Troubleshooting"]
---

# JPA 비영속 벌크 연산의 역습: 1차 캐시 불일치로 겪은 더티 리드 참사

JPA를 쓸 때 가장 사랑했던 기능은 단연 영속성 컨텍스트(Persistence Context)의 '더티 체킹(Dirty Checking)'이었다.
객체를 가져와서 자바 필드 값만 수정해도, 트랜잭션이 끝날 때 구구절절 `UPDATE` SQL을 칠 필요 없이 알아서 쿼리가 날아가는 경험은 생산성의 극치였다.

하지만 실무에서 10만 개 단위의 상품 정보를 일괄 인상하는 어드민 스케줄러를 개발하던 날, 내 아키텍처는 산산조각 났다. 10만 건을 하나씩 조회해와서 객체의 필드를 수정하는 것은 성능 낭비임이 불 보듯 뻔했기 때문이다. 그래서 나는 의기양양하게 **벌크 연산(Bulk Update)** 쿼리를 직접 작성해 성능을 극강으로 올려치기했다.
그런데 며칠 뒤, 해당 로직을 통과한 직후 파생되는 결제나 계산 로직 등에서 '과거의 가격 데이터'로 결제가 뚫리는 치명적인 더티 리드(Dirty Read) 사고가 발생하고 말았다. 식은땀을 흘리며 로그를 뒤지던 그날 밤의 깨달음을 잊지 않기 위해 기록해 둔다.

---

## 1. 벌크 연산은 JPA의 꽃(영속성 컨텍스트)을 무시한다

사건의 발단은 내가 짠 아래의 `UPDATE` 구문이었다.

```java
@Modifying
@Query("UPDATE Product p SET p.price = p.price * 1.1 WHERE p.category = :category")
int updatePriceForCategory(@Param("category") String category);
```

이 쿼리 한 방은 분명히 DB를 쾌속으로 쓸고 지나가며 10만 건을 순식간에 업데이트했다. 여기까지는 아주 현명한 판단이었다고 자부했다. 
그런데 실무 환경에서는 이 벌크 로직 직후, 동일 트랜잭션 안에서 방금 수정된 상품의 객체를 다시 조회하여 어떤 계산 로직에 사용하는 또 다른 서비스 군이 물려 있었다.

```java
@Transactional
public void processPriceIncrease(String category) {
    // 1. 여기서 상품 하나를 단건 조회했다. (DB 가격: 10,000원 -> 1차 캐시에 저장됨)
    Product myProduct = productRepository.findById(1L);

    // 2. 벌크 연산 폭격! (DB는 11,000원으로 완벽하게 업데이트 됨)
    productRepository.updatePriceForCategory(category);

    // 3. 자, 이제 영속성 컨텍스트에 있는 상품을 다시 불렀으니 11,000원이 뜨겠지?
    Product refreshedProduct = productRepository.findById(1L);
    System.out.println("변경 후 가격: " + refreshedProduct.getPrice()); // 왜 10,000원이야???
}
```

디버거를 띄워놓고 변수값을 확인하던 순간 소름이 돋았다.
DB에는 엄연히 11,000원이 찍혀 진실(Truth)이 업데이트되었는데, 내 코드의 객체에는 여전히 구시대의 10,000원이 유령처럼 남아있었던 것이다.

원인은 명확했다. **벌크 연산은 영속성 컨텍스트에 들리지 않고 데이터베이스에 SQL을 다이렉트로 때려버리기 때문이었다.** 
JPA는 너무나 똑똑하게도 "어? `findById()`로 부르네? 1차 캐시에 아까 가져다 놓은 ID 존재하네! 굳이 무거운 DB 갈 필요 없이 이 객체 그대로 쓰면 되겠다!"라며 완벽한 신뢰를 보냈고, 그 신뢰가 내 시스템의 목을 옥죄었던 것이다.

---

## 2. 진실을 마주하기 위해 판을 엎어라

벌크 쿼리가 지나간 폐허 위에서, 내 1차 캐시는 과거의 환영을 붙잡고 있었다. 이걸 끊어내기 위해서는 "1차 캐시를 가차 없이 지워버리는 결단"이 필요했다. 

나는 이 문제를 잡기 위해 `EntityManager`의 `clear()` 메서드를 이용해 메모리를 수동으로 싹 초기화시키는 방법을 찾아냈다. 1차 캐시가 텅텅 비어버리면, 그 다음번 조회 때는 JPA가 "캐시에 없네? 무조건 DBに行って 긁어와야겠다!"라고 정상 판정하여 최신 데이터를 가져올 수밖에 없기 때문이다.

하지만 이마저도 스프링 데이터 JPA 개발자들이 이미 아름답게 닦아둔 스펙이 있었다. 바로 내가 벌크 쿼리 위에 무심코 달아뒀던 `@Modifying` 어노테이션의 옵션이었다.

```java
// clearAutomatically = true 옵션 하나면 
// 벌크 쿼리 직후에 자동으로 em.clear()를 터뜨려 캐시를 박살내준다!
@Modifying(clearAutomatically = true) 
@Query("UPDATE Product p SET p.price = p.price * 1.1 WHERE p.category = :category")
int updatePriceForCategory(@Param("category") String category);
```

이 옵션을 활성화하고 코드를 재실행하는 순간, 디버거에는 그토록 원하던 11,000원의 올바른 값이 눈물겹게 찍혀 나왔다.

---

## 맺으며

아키텍처의 세계에서 "편리함 뒤에는 반드시 부작용이라는 청구서가 붙는다"는 격언을 뼈저리게 실감했다.

JPA가 제공하는 1차 캐시와 영속성 컨텍스트의 마법은 개발을 극도로 윤택하게 해주지만, 로우쿼리 레벨의 대량 연산과 부딪히는 지점에서는 개발자가 수동으로 그 연결고리를 끊어낼 줄 아는 통제력을 잃어서는 안 된다.
단순히 "구글에서 긁어온 코드로 쿼리 성능을 10배 높였습니다!"라고 우쭐댔던 과거를 넘어, 그 이면에서 파생될 캐시 전략의 정합성을 고민하게 된 이 순간. 나는 비로소 더 나은 아키텍처를 설계하는 길에 첫걸음을 디뎠다고 믿는다.
