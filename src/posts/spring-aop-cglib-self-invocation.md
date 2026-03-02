---
title: "Spring AOP의 배신인가 나의 무지인가: @Transactional과 Self-Invocation의 함정"
description: "같은 클래스 내부에서 @Transactional 메서드를 호출했을 때 왜 롤백이 되지 않는지 뼈저리게 겪고, Spring AOP 프록시의 본질을 파헤친 기록입니다."
date: "2026-02-26"
tags: ["Java", "Spring", "AOP", "Backend", "Troubleshooting"]
---

# Spring AOP의 배신인가 나의 무지인가: @Transactional과 Self-Invocation의 함정

돌이켜보면 참 부끄러운 일이다. 그동안 나는 스프링 프레임워크를 사용하면서 `@Transactional`이라는 어노테이션을 마치 전가의 보도처럼 휘두르기만 했다. 그저 메서드 위에 한 줄 적어두면 데이터베이스 롤백이 완벽하게 알아서 거미줄처럼 묶일 거라는 맹신에 빠져있었다.

그러던 어느 날, 분명히 `@Transactional`을 달아두었는데도 예외 발생 시 DB 롤백이 전혀 되지 않아 쓰레기 데이터가 쌓이는 기이한 현상을 마주했다. 
"어? 분명 어노테이션을 달았는데 왜 동작을 안 하지? 스프링 버그인가?"
원인을 계속 찾으며 디버깅하다가, 결국 이것은 프레임워크의 배신이 아니라 AOP(Aspect-Oriented Programming) 프록시 구조에 대한 내 무지함에서 비롯된 참사였음을 깨달았다. 더 나은 백엔드 개발자로 도약하기 위해서는 이 '마법 껍데기'의 실체를 알아야만 했다.

---

## 1. 프록시(Proxy)의 거짓말, 그리고 내부 호출의 참극

스프링이 `@Transactional`이 달린 클래스의 빈(Bean)을 어떻게 관리하는지 문서를 찾아보고 나서야 뒤통수를 맞은 기분이었다. 스프링은 원본 객체를 직접 컨테이너에 올리지 않는다. CGLIB 등을 이용해 원본 객체에 껍데기(Proxy)를 덮어씌운 '가짜 객체'를 만들어 빈으로 등록하는 것이었다.

외부에서 이 빈을 호출하면, 가짜 객체가 이를 가로채서(Intercept) **"어? 여기에 @Transactional이 있네? 내가 트랜잭션 수문장 역할을 해줄게!"** 하고 열어준 뒤 진짜 객체를 부른다.

그런데 내 문제가 발생했던 코드는 정확히 이러했다.

```java
@Service
public class OrderService {

    // 1. 외부 컨트롤러에서 이 메서드를 호출 (트랜잭션 없음)
    public void createOrder(OrderDTO dto) {
        log.info("주문 생성 시작...");
        
        // 2. [문제 발생] 같은 클래스 내부의 트랜잭션 메서드를 호출! (Self-Invocation)
        this.saveOrderWithTransaction(dto); 
    }

    @Transactional
    public void saveOrderWithTransaction(OrderDTO dto) {
        orderRepository.save(dto.toEntity());
        // 여기서 RuntimeException이 터졌지만 롤백은 되지 않았다.
        throw new RuntimeException("DB 저장 중 에러 발생!");
    }
}
```

이 코드가 안 돌아간 이유는 철저한 논리적 필연이었다. 외부에서 단일 진입점인 `orderService.createOrder()`를 불렀을 땐 트랜잭션 어노테이션이 없으니 프록시가 그냥 원본 객체로 쌩 통과를 시켰다.
그리고 원본 객체 내부에서 진행된 `this.saveOrderWithTransaction(dto)`. 나는 여기서 `this`가 무엇을 가리키는지 망각하고 있었다. 이것은 **진짜 객체가 자기 자신의 주소를 참조하여 내부 메서드를 부른 것**이다. 스프링이 고생해서 만들어둔 바깥의 그 껍데기(Proxy)를 거칠 일이 하등 없었던 것이다. 당연히 트랜잭션이 여리지 않았고, 에러가 터져도 Auto-Commit된 데이터는 롤백되지 않았다.

---

## 2. 무지를 인정하고 아키텍처를 고치다

이 Self-Invocation(내부 호출) 딜레마를 해결하기 위해 스택오버플로우와 여러 레퍼런스를 뒤적였다. 

처음엔 내 코드(주력 서비스)를 뜯어고치기 싫어서, 자기 자신의 껍데기를 자기가 주입받아 사용하는 기형적인 `Self-Injection` 꼼수를 써보기도 했다. 혹은 `AspectJ Weaver`를 달아 바이트코드를 조작해 버릴까 하는 생각도 했다. 

하지만 결국 "트랜잭션이 분리되어야 할 만큼 독립적인 로직이라면, 클래스 분할(책임의 분리)이 원칙적으로 맞는 게 아닐까?"라는 선배들의 조언과 결론에 도달했다.

```java
@Service
@RequiredArgsConstructor
public class OrderFacadeService {
    // 트랜잭션이 필요한 행위를 아예 다른 빈으로 분리해냈다.
    private final OrderCommandService orderCommandService;

    public void createOrder(OrderDTO dto) {
        // 다른 빈을 부르므로 정상적으로 프록시(Proxy) 장막을 통과한다!
        orderCommandService.saveOrderWithTransaction(dto);
    }
}
```

단순히 파일 위치를 옮긴 것처럼 보이지만, 이 리팩토링으로 객체지향적인 책임 분리와 프레임워크의 동작 원리 두 마리 토끼를 잡을 수 있었다.

---

## 맺으며

돌아보면, 장애가 났던 그 날 "어노테이션 제대로 달았는데 안 돌아가요!"라고 변명하려 했던 내 모습이 부끄럽게 느껴진다. 

스프링 AOP의 함정은 프레임워크가 주는 그 달콤한 '편리함' 뒤에 숨겨진 구동 원리를 알려고 하지 않은 사람에게 내려지는 형벌과도 같다. 이번 삽질을 계기로, 적어도 트랜잭션 병목이나 오류가 발생했을 때 이 프록시가 지금 어디까지 덮여있는가를 상상하고 추적할 수 있는 눈을 조금은 가지게 된 것 같다. 단순한 API 작성자를 넘어, 진짜 프레임워크와 대화할 수 있는 백엔드 개발자로 한 걸음 더 나아가고 싶다.
