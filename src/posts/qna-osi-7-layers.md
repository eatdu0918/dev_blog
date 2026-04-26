---
published: true
type: 'qna'
level: 'junior'
title: "OSI 7계층과 TCP/IP 4계층의 차이를 설명해 주세요"
date: '2026-04-27'
categories: ['CS', 'Network']
---

## 핵심 요약

면접에서 "OSI 7계층 외워보세요"는 너무 자주 나와서 거의 ritual. 단순 암기 대신 **각 계층이 푸는 문제**를 설명하면 훨씬 좋습니다.

## OSI 7계층 (위에서 아래)

| 계층 | 역할 | 대표 프로토콜/단위 |
|---|---|---|
| 7. Application | 애플리케이션 인터페이스 | HTTP, FTP, SMTP, DNS |
| 6. Presentation | 인코딩, 암호화, 압축 | TLS(여기서 다루는 시각), JPEG |
| 5. Session | 세션 관리 | RPC, NetBIOS |
| 4. Transport | 신뢰성, 흐름 제어, 포트 | TCP, UDP / Segment |
| 3. Network | 라우팅, IP 주소 | IP, ICMP / Packet |
| 2. Data Link | 물리 주소, 프레이밍 | Ethernet, Wi-Fi / Frame |
| 1. Physical | 비트 전송 | 케이블, 전파 / Bit |

## TCP/IP 4계층 (현실 모델)

OSI는 이론, **실제 인터넷은 TCP/IP 4계층**.

| TCP/IP | OSI 매핑 |
|---|---|
| Application | 5+6+7 |
| Transport | 4 |
| Internet | 3 |
| Network Access | 1+2 |

요즘 면접도 TCP/IP 4계층으로 답하는 경우 多.

## 각 계층의 핵심 역할

### Application
- 사용자 데이터 형식, 의미.
- HTTP 요청/응답, DNS 질의 등.

### Transport (TCP/UDP)
- **포트 번호**로 프로세스 식별.
- TCP: 신뢰성, 순서, 흐름·혼잡 제어.
- UDP: 경량, 비신뢰.

### Network (IP)
- **IP 주소**로 호스트 식별.
- 라우터가 다음 hop 결정.
- IP는 비신뢰 best-effort.

### Data Link (Ethernet/Wi-Fi)
- **MAC 주소**로 같은 네트워크 안에서 식별.
- 충돌 감지, 프레임 체크섬.

## 캡슐화

데이터가 내려가며 헤더가 추가:
```
HTTP body
↓ + TCP header → Segment
↓ + IP header  → Packet
↓ + Eth header → Frame
↓               → Bits
```

받는 쪽은 역순으로 헤더를 벗김(decapsulation).

## 주소 체계 비교

| 계층 | 주소 |
|---|---|
| App | URL |
| Transport | 포트(16bit) |
| Network | IP(IPv4 32bit / IPv6 128bit) |
| Data Link | MAC(48bit) |

DNS = URL → IP. ARP = IP → MAC.

## TLS는 어디?

논쟁의 단골. OSI 모델로는 **표현 계층(6)** 또는 세션/표현 사이로 보지만, 실제로는 TCP 위 + Application 아래 사이에 끼어 있는 별도 레이어.

HTTPS = HTTP + TLS + TCP. HTTP/3 = HTTP + QUIC(UDP 위에 신뢰성/암호화 통합).

## 라우터 vs 스위치 vs 허브

- **허브**: 1계층. 모든 포트로 무조건 전송. 거의 안 씀.
- **스위치**: 2계층. MAC 주소 기반. 같은 LAN 안 통신.
- **라우터**: 3계층. IP 기반. 다른 네트워크 간 통신.
- **L7 로드밸런서**: 7계층. URL/헤더 기반 라우팅(Nginx, Envoy).

## 자주 헷갈리는 디테일

- "OSI = 인터넷 표준"이 아님. ISO의 참조 모델일 뿐. 실 구현은 TCP/IP.
- 5(Session) 계층은 현대 네트워크에서 모호. HTTP의 쿠키/세션은 7계층에서 처리.
- ICMP는 3계층에서 동작하지만 IP를 사용 — 분류상 혼선.

## 면접 follow-up

- "URL 입력부터 화면 표시까지 흐름?" → DNS(7) → TCP(4) → TLS → HTTP 요청 → 서버 처리 → 응답 → 브라우저 렌더링. 각 단계에서 어떤 계층이 동작하는지.
- "패킷이 손실되면 어디서 처리?" → TCP(4)가 재전송. UDP는 앱이 직접.
- "IP가 비신뢰인 이유?" → 단순함 + 라우팅 효율. 신뢰성은 위 계층(TCP)이 책임.
