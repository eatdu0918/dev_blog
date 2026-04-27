---
published: true
type: 'qna'
level: 'junior'
title: "OSI 7계층과 TCP/IP 4계층의 차이를 설명해 주세요"
date: '2026-04-27'
categories: ['CS', 'Network']
---

## Q1. OSI 7계층을 위에서 아래로 설명해 주세요.

**A.** 단순 암기보다 **각 계층이 푸는 문제**를 같이 답하면 좋습니다.

| 계층 | 역할 | 대표 프로토콜/단위 |
|---|---|---|
| 7. Application | 애플리케이션 인터페이스 | HTTP, FTP, SMTP, DNS |
| 6. Presentation | 인코딩, 암호화, 압축 | TLS, JPEG |
| 5. Session | 세션 관리 | RPC, NetBIOS |
| 4. Transport | 신뢰성, 흐름 제어, 포트 | TCP, UDP / Segment |
| 3. Network | 라우팅, IP 주소 | IP, ICMP / Packet |
| 2. Data Link | 물리 주소, 프레이밍 | Ethernet, Wi-Fi / Frame |
| 1. Physical | 비트 전송 | 케이블, 전파 / Bit |

---

## Q2. TCP/IP 4계층은 OSI와 어떻게 매핑되나요?

**A.** TCP/IP는 실제 인터넷의 모델이고, OSI는 이론 참조 모델입니다.

| TCP/IP | OSI 매핑 |
|---|---|
| Application | 5+6+7 |
| Transport | 4 |
| Internet | 3 |
| Network Access | 1+2 |

요즘 면접에서는 OSI보다 **TCP/IP 4계층으로 답하는 경우가 더 많습니다**. 5(Session) 계층은 현대 네트워크에서 모호해서 7로 통합되어 있습니다.

---

## Q3. 캡슐화는 어떻게 일어나나요?

**A.** 데이터가 계층을 내려갈 때마다 **헤더가 추가**됩니다.

```
HTTP body
↓ + TCP header → Segment
↓ + IP header  → Packet
↓ + Eth header → Frame
↓               → Bits
```

받는 쪽은 역순으로 헤더를 벗기며 올라갑니다(decapsulation). 각 계층은 자기 헤더만 처리하고 그 위 계층 데이터는 페이로드로만 봅니다.

---

## Q4. 각 계층의 주소 체계는 어떻게 다른가요?

**A.** 계층마다 식별 단위가 다릅니다.

| 계층 | 주소 |
|---|---|
| Application | URL |
| Transport | 포트(16bit) |
| Network | IP(IPv4 32bit / IPv6 128bit) |
| Data Link | MAC(48bit) |

변환:
- **DNS**: URL → IP.
- **ARP**: IP → MAC(같은 네트워크 안).
- **NAT**: 사설 IP ↔ 공인 IP.

---

## Q5. TLS는 어느 계층에 속하나요?

**A.** 논쟁의 단골입니다. OSI 모델로는 **표현 계층(6)** 또는 세션/표현 사이로 보지만, 실제로는 **TCP 위 + Application 아래의 별도 레이어**라고 보는 게 정확합니다.

- HTTPS = HTTP + TLS + TCP.
- HTTP/3 = HTTP + QUIC(UDP 위에 TLS 1.3 통합).

명확한 계층 분류보다 "TCP와 HTTP 사이에 끼어 암호화/인증을 담당한다"로 답하는 게 안전합니다.

---

## Q6. 라우터와 스위치, 허브는 각각 어느 계층 장비인가요?

**A.**

- **허브(L1)**: 모든 포트로 무조건 전송. 거의 안 씀.
- **스위치(L2)**: MAC 주소 기반. 같은 LAN 안 통신.
- **라우터(L3)**: IP 기반. 다른 네트워크 간 통신.
- **L7 로드밸런서**(Nginx, Envoy): URL/헤더 기반 라우팅.

L4 LB(LVS, AWS NLB)는 IP+포트 기반, L7 LB는 HTTP 헤더 기반이라는 차이도 자주 묻습니다.

---

## Q7. URL을 입력하고 화면이 보이기까지의 흐름을 계층별로 설명해 주세요.

**A.** 각 계층이 차례로 동작합니다.

1. **DNS(L7)**: 도메인 → IP 변환.
2. **TCP 3-way handshake(L4)**: 서버와 커넥션.
3. **TLS handshake**: 암호화 채널.
4. **HTTP 요청(L7)**: 서버에 요청.
5. 서버가 응답 → 위와 역순으로 클라이언트에 도착.
6. **브라우저 렌더링**: HTML 파싱, CSS/JS 적용, 페인트.

각 단계의 책임 계층을 알면 어디서 지연이 발생하는지 진단이 쉽습니다.

---

## Q8. 패킷 손실은 어디서 처리되나요?

**A.** **TCP(L4)** 가 시퀀스 번호 + ACK + 재전송으로 처리합니다.

UDP는 손실 처리를 안 합니다 → 애플리케이션이 직접 책임. 게임/음성/영상에서 "재전송하느니 누락이 낫다"는 시나리오에 적합.

IP(L3)는 best-effort라 신뢰성을 보장하지 않습니다. 신뢰성은 위 계층(TCP)이 짊어집니다.

---

## Q9. OSI 모델을 그대로 외우는 게 의미가 있나요?

**A.** **단순 암기보다 동작 원리 이해가 중요**합니다.

OSI는 ISO의 참조 모델이고 실제 인터넷은 TCP/IP로 구현됐기 때문에 7계층을 그대로 따르지 않습니다. 5(Session)은 거의 안 쓰이고, TLS 위치도 모호합니다.

면접에서는:
- 각 계층이 어떤 문제를 푸는지.
- 어떤 프로토콜이 어디서 동작하는지.
- 캡슐화가 어떻게 일어나는지.

이 셋만 깔끔히 설명할 수 있으면 충분합니다.
