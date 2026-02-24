---
title: "MSA 통신을 우아하게: OpenFeign으로 선언적 서비스 호출 구현하기"
description: "RestTemplate은 이제 안녕! sparta-msa-final-project에서 복잡한 서비스 간 호출을 인터페이스 하나로 해결한 OpenFeign 활용법을 소개합니다."
date: "2026-02-24"
tags: ["Architecture"]
---

# MSA 통신을 우아하게: OpenFeign으로 선언적 서비스 호출 구현하기

마이크로서비스 아키텍처(MSA)에서 각 서비스는 서로에게 필요한 데이터를 묻고 답합니다. 예전에는 `RestTemplate`이나 `WebClient`를 써서 URI를 만들고, 헤더를 세팅하고, 응답을 파싱하는 복잡한 코드를 직접 짰습니다. 하지만 서비스가 늘어날수록 이 코드는 유지보수의 짐이 됩니다.

[`sparta-msa-final-project`](https://github.com/eatdu0918/sparta-msa-final-project)에서는 이 문제를 **Spring Cloud OpenFeign**을 통해 선언적으로 해결했습니다.

---

## 🧐 OpenFeign이란? (인터페이스만 만드세요)

OpenFeign은 **인터페이스에 어노테이션만 붙이면 구현체는 라이브러리가 자동으로 만들어주는** HTTP 클라이언트 도구입니다. 개발자는 마치 자기 서비스 안에 있는 메소드를 호출하듯이 타 서비스를 호출할 수 있게 됩니다.

### 🏗️ 실전 코드 분석: 주문 서비스가 상품 정보를 조회할 때

'주문 서비스'가 '상품 서비스'에 재고나 가격 정보를 물어봐야 하는 상황입니다.

```java
// ProductServiceClient.java (Order Service 내부에 위치)
@FeignClient(name = "product-service", url = "${PRODUCT_SERVICE_URL:http://product-service:8081}")
public interface ProductServiceClient {

    @GetMapping("/api/v1/products/{id}")
    ProductResponse getProductById(@PathVariable("id") Long id);

    @PostMapping("/api/v1/products/reduce-stock")
    void reduceStock(@RequestBody List<OrderItemRequest> items);
}
```

이제 비즈니스 로직(OrderService)에서는 이 인터페이스를 주입받아 쓰기만 하면 됩니다.

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    private final ProductServiceClient productServiceClient;

    public void createOrder(OrderRequest request) {
        // 내부 메소드 호출하듯 타 서비스 호출!
        ProductResponse product = productServiceClient.getProductById(request.getProductId());
        
        if (product.getStock() < request.getQuantity()) {
            throw new RuntimeException("재고 부족");
        }
        // ... 중간 생략 ...
    }
}
```

---

## ⚠️ MSA 동기 통신의 함정: 장애 전파(Cascading Failure)

OpenFeign은 매우 편리하지만, **동기(Synchronous) 호출**이라는 점을 주의해야 합니다. 

1.  **타임아웃 설정 필수**: 만약 '상품 서비스'가 응답을 주지 않고 무한정 대기한다면, '주문 서비스'의 스레드도 모두 점유되어 서비스 전체가 마비될 수 있습니다.
2.  **서킷 브레이커(Circuit Breaker) 연동**: 타 서비스가 반복적으로 에러를 낸다면, 더 이상 호출하지 않고 즉시 에러를 반환하여 장애 전파를 차단해야 합니다. (예: Resilience4j 사용)

### 🛠️ 우리 프로젝트의 타임아웃 설정 예시 (`application.yml`)

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          default:
            connectTimeout: 5000  # 서버 연결까지의 시간
            readTimeout: 5000     # 데이터 응답을 기다리는 시간
```

---

## 💡 OpenFeign 활용 꿀팁

- **Header 가로채기 (RequestInterceptor)**: Gateway를 통해 전달된 JWT나 사용자 정보를 타 서비스 호출 시에도 그대로 전달하고 싶다면 인터셉터를 활용하세요.
- **로깅 커스터마이징**: 개발 환경에서는 `Full` 로그를 통해 요청/응답 전체를 확인하고, 운영 환경에서는 `Basic` 로그로 효율을 높일 수 있습니다.

## 마무리

OpenFeign은 MSA 시스템의 복잡한 통신 코드를 획기적으로 줄여주어 개발 생산성을 높여줍니다. 다만 동기 호출의 위험성을 인지하고, 적절한 타임아웃과 장애 복구 전략을 함께 가져가는 것이 중요합니다.

다음 포스팅에서는 수많은 마이크로서비스들이 잘 돌아가고 있는지 한눈에 감시하는 방법, **Prometheus와 Grafana 모니터링**에 대해 알아보겠습니다!
