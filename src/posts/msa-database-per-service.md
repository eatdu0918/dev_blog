---
title: "MSA에서 Database per Service, 왜 나누고 어떻게 연결하나?"
description: "sparta-msa-final-project의 7개 DB 격리 사례를 통해 MSA 데이터 설계의 핵심 원칙과 실무적인 트레이드오프를 살펴봅니다."
date: "2026-02-24"
tags: ["Architectural"]
---

# MSA에서 Database per Service, 왜 나누고 어떻게 연결하나?

마이크로서비스 아키텍처(MSA)를 도입할 때 가장 먼저 맞닥뜨리는 변화는 아마 **"데이터베이스의 분리"**일 것입니다. 하나의 거대한 DB(Monolithic DB)를 쓰던 시절에서 벗어나, 각 서비스가 자신만의 DB 주권을 갖는 **Database per Service** 패턴은 MSA의 독립성을 완성하는 핵심입니다.

[`sparta-msa-final-project`](https://github.com/eatdu0918/sparta-msa-final-project)에서는 총 7개의 백엔드 서비스가 각각 독립적인 MySQL 인스턴스를 사용하여 완벽한 격리를 구현했습니다.

---

## 🤔 왜 굳이 DB를 귀찮게 나눠야 할까?

단순히 유행이라서 나누는 것은 아닙니다. DB를 분리함으로써 얻는 확실한 이점들이 있습니다.

1.  **느슨한 결합 (Loose Coupling)**: 특정 서비스의 DB 스키마가 변경되어도 다른 서비스는 영향을 받지 않습니다. '주문' 테이블 컬럼 바꾼다고 '상품' 서비스가 죽는 일이 사라집니다.
2.  **독립적 확장성 (Scalability)**: 주문 트래픽이 몰리면 주문 DB만 고성능 인스턴스로 교체하거나 읽기 분산(Read Replica)을 적용할 수 있습니다.
3.  **기술 선택의 자유**: 어떤 서비스는 JPA/MySQL이 어울리고, 어떤 서비스는 MongoDB가 어울릴 수 있습니다. 각 서비스 목적에 맞는 DB를 선택할 수 있게 됩니다.

---

## 🏗️ 프로젝트의 설계 사례 (Docker Compose)

프로젝트에서는 `docker-compose.yml`을 통해 서비스마다 개별 포트를 할당한 독립 DB들을 운영하고 있습니다.

```yaml
services:
  user-mysql:
    image: mysql:8.0
    ports: ["3307:3306"]
    environment: [MYSQL_DATABASE=user_db]

  product-mysql:
    image: mysql:8.0
    ports: ["3308:3306"]
    environment: [MYSQL_DATABASE=product_db]

  order-mysql:
    image: mysql:8.0
    ports: ["3309:3306"]
    environment: [MYSQL_DATABASE=order_db]
  # ... 나머지 서비스들도 동일하게 격리
```

이렇게 하면 한 서비스가 DB 부하로 인해 장애가 나더라도, **장애가 다른 서비스로 전파되지 않는 '격벽' 역할**을 하게 됩니다.

---

## 🧐 DB가 나눠지면 발생하는 문제: "JOIN이 안 돼요!"

DB를 나누면 가장 곤란한 지점은 **여러 도메인의 데이터를 묶어서 보여줘야 할 때**입니다. 주문 내역을 보여주는데 상품명과 사용자 이름이 필요하다면 어떻게 해야 할까요? 프로젝트에서는 두 가지 전략을 사용했습니다.

### 1. API 컴포지션 (Aggregation)
주문 서비스가 직접 '상품 서비스'와 '사용자 서비스'에 API를 호출하여 데이터를 조립하는 방식입니다.
- **장점**: 구현이 단순하고 데이터 정합성이 높음.
- **단점**: 네트워크 오버헤드가 발생하고, 호출하는 서비스들이 모두 살아있어야 함.

### 2. 데이터 복제 (Data Replication)
Kafka 같은 메시지 브로커를 이용해 필요한 최소한의 정보를 자기 DB에 미리 복사해 두는 방식입니다.
- **장점**: 자신의 DB만 조회하면 되므로 성능이 매우 빠름.
- **단점**: 약간의 데이터 시차가 발생(최종 정합성)하며 구조가 복잡해짐.

---

## 💡 실무 팁: 트랜잭션의 범위

Database per Service 환경에서는 **하나의 트랜잭션(`@Transactional`)으로 여러 DB를 묶을 수 없습니다.** 따라서 지난 포스팅에서 다룬 **Saga 패턴**이나 **Transactional Outbox 패턴**이 필수적인 동반자가 됩니다.

## 마무리

DB 분리는 MSA의 장점을 극대화하기 위한 선택이지만, 그만큼 데이터 관리의 복잡성을 대가로 지불해야 합니다. 하지만 적절한 데이터 연동 전략과 분산 트랜잭션 패턴을 이해한다면, 훨씬 더 견고하고 유연한 시스템을 구축할 수 있습니다.

다음 포스팅에서는 서비스 간에 서로 데이터를 주고받을 때 더 편리하게 사용할 수 있는 도구, **OpenFeign**에 대해 알아보겠습니다!
