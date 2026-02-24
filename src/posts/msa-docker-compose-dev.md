---
title: "MSA의 첫걸음: Docker Compose로 복잡한 개발 환경 구축하기"
description: "7개 서비스와 10개 인프라를 언제 다 띄우죠? sparta-msa-final-project의 docker-compose.yml 하나면 충분합니다."
date: "2026-02-24"
tags: ["Architecture"]
---

# MSA의 첫걸음: Docker Compose로 복잡한 개발 환경 구축하기

마이크로서비스 아키텍처(MSA)를 개발할 때 가장 먼저 겪는 장벽은 **"로컬 개발 환경 구축"**입니다. 내 컴퓨터에 MySQL 7개와 Redis, Kafka, Elasticsearch를 모두 설치하고 일일이 실행하는 것은 불가능에 가깝습니다.

[`sparta-msa-final-project`](https://github.com/eatdu0918/sparta-msa-final-project)에서는 이 문제를 **Docker Compose**를 통해 단 한 줄의 명령어로 해결했습니다.

---

## 🏗️ Docker Compose: MSA의 지휘자

Docker Compose는 여러 개의 Docker 컨테이너를 하나의 서비스로 정의하고 관리할 수 있게 해주는 도구입니다. 복잡한 네트워크 설정, 볼륨 마운트, 환경 변수 관리를 `docker-compose.yml` 파일 하나로 끝낼 수 있습니다.

### 🛠️ 우리 프로젝트의 구성 (총 17개 컨테이너)

- **백엔드 서비스 (7개)**: Gateway, User, Product, Order, Discount, Payment, Cancel, Refund
- **데이터베이스 (7개)**: MySQL (7개 독립 인스턴스)
- **메시지 브로커 & 캐시 (3개)**: Zookeeper, Kafka, Redis
- **모니터링 & 로그 (5개)**: Prometheus, Grafana, Elasticsearch, Logstash, Kibana

이 모든 것을 손수 관리하는 대신, `docker-compose up -d` 명령어 하나면 약 2분 만에 전체 시스템이 가동됩니다.

---

## 🎯 실전에서 배운 Docker Compose 핵심 노하우

### 1. 실행 순서 보장 (`depends_on` & `healthcheck`)
서비스들이 무작위로 뜨면 에러가 발생합니다. 예를 들어 DB가 아직 준비되지 않았는데 애플리케이션이 뜨면 연결 실패로 서버가 종료됩니다.

```yaml
services:
  order-mysql:
    # ... 생략 ...
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 5

  order-service:
    # ... 생략 ...
    depends_on:
      order-mysql:
        condition: service_healthy # DB가 '건강한' 상태가 될 때까지 대기!
```

### 2. 환경 변수를 통한 유연한 설정
환경 마다 설정이 달라질 수 있습니다. Docker Compose의 `environment` 섹션을 활용해 DB 주소나 비밀번호를 주입하면 코드 수정 없이 다양한 환경에 대응할 수 있습니다.

```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:mysql://order-mysql:3306/order_db
  KAFKA_SERVERS: kafka:29092
```

### 3. 볼륨(Volumes)을 통한 데이터 영속성
컨테이너를 끄고 켜도 로그나 DB 데이터가 사라지지 않도록 호스트 PC와 저장 공간을 연결(Mapping)해야 합니다.

```yaml
volumes:
  order_mysql_data: # 정의된 볼륨을 사용해 데이터 보존
```

---

## 💡 로컬 개발 시 팁

- **선택적 실행**: 모든 서비스를 띄우기에 사양이 부족하다면 `docker-compose up order-service order-mysql kafka` 처럼 필요한 것만 골라 실행하세요.
- **리소스 제한 (Memory Limits)**: 로컬 개발 환경에서 수많은 컨테이너를 감당하려면 각 컨테이너의 메모리 사용량을 적절히 제한해야 합니다.
    ```yaml
    deploy:
      resources:
        limits:
          memory: 512M
    ```

---

## 🎉 시리즈를 마무리하며

지금까지 총 7개의 포스팅을 통해 [`sparta-msa-final-project`](https://github.com/eatdu0918/sparta-msa-final-project)에 적용된 MSA 핵심 기술들을 살펴보았습니다.

인증(Gateway), 트랜잭션(Saga), 데이터 독립성(Database per Service), 통신(OpenFeign), 모니터링, 로깅, 그리고 마지막 환경 구축까지. MSA는 분명 복잡하고 배울 것이 많지만, 그만큼 견고하고 확장성 있는 시스템을 만드는 강력한 도구가 됩니다.

이 포스팅 시리즈가 여러분의 MSA 여정에 작은 도움이 되었기를 바랍니다!
