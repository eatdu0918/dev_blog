---
title: "데이터는 어떻게 안전하게 전달될까? HTTP와 HTTPS의 차이 탐구"
date: "2026-02-27"
description: "웹 통신의 기본인 HTTP와, 암호화 계층을 더해 보안성을 높인 HTTPS의 구조적 차이를 확인하고 테스트 코드로 개념을 시뮬레이션해 본 과정을 정리합니다."
---

웹 개발을 하면서 API를 호출할 때 당연하게 `https://`로 시작하는 주소를 사용해 왔습니다. "요즘은 다 HTTPS를 필수로 써야 해"라는 피상적인 이해를 넘어, 왜 S(Secure)가 붙어야만 안전한지, 그리고 근본적으로 HTTP가 어떻게 동작하기에 정보 유출의 위험이 존재하는지 그 원리를 파헤쳐 보고 싶어졌습니다.

이 글에서는 네트워크 통신의 기초인 HTTP의 원형과, 암호화가 더해진 HTTPS의 차이를 짚어보고, 이를 테스트 코드로 간단히 시뮬레이션해 보며 깨달은 점을 정리해 보려 합니다.

![HTTP 보안과 HTTPS 암호화 비교](/public/images/http_vs_https.png)
*데이터가 평문으로 이동하는 HTTP와 암호화 방패가 적용된 HTTPS의 시각적 비교*

## 상태를 주고받는 기본 원리: HTTP

**HTTP(HyperText Transfer Protocol)**는 웹 브라우저(클라이언트)와 서버가 데이터를 주고받기 위해 정의된 통신 규약입니다. 

초창기 웹 통신을 위해 만들어진 HTTP는 데이터를 '평문(Plaintext)' 형태의 문자열로 전송합니다. 이 방식은 구조가 단순하고 빠르다는 장점이 있지만, 치명적인 단점이 하나 있습니다. 통신 과정(네트워크 라우터, 와이파이 접점 등)의 중간에서 악의적인 누군가가 패킷을 가로채면 주고받는 데이터의 내용이 그대로 노출된다는 점입니다. 예를 들어 로그인 요청을 보낼 때 아이디와 비밀번호가 암호화되지 않은 채 네트워크를 타고 흘러가게 됩니다.

## 방패를 두른 통신: HTTPS

이러한 보안 취약점을 해결하기 위해 등장한 것이 바로 **HTTPS(HTTP Secure)**입니다.

HTTPS는 HTTP와 완전히 다른 새로운 프로토콜이 아닙니다. 기존 HTTP 통신 위에 **SSL/TLS(Secure Sockets Layer / Transport Layer Security)**라는 암호화 보안 계층을 한 겹 씌운 것입니다.
HTTPS의 핵심 동작 원리는 다음과 같습니다.

1. **연결 및 Handshake**: 클라이언트와 서버가 통신을 시작하기 전, 신뢰할 수 있는 서버인지 인증서(Certificate)를 확인하고 암호화에 사용할 '비밀키'를 안전하게 주고받습니다.
2. **데이터 암호화**: Handshake가 성공적으로 끝나면, 주고받는 모든 HTTP 요청과 응답 데이터는 대칭키 알고리즘을 통해 암호화됩니다.
3. **안전한 전송**: 중간에서 데이터를 가로채더라도 복잡한 암호문으로만 보이기 때문에, 키를 보유한 클라이언트와 서버만 데이터를 정상적으로 해독할 수 있습니다.

## 코드 단위로 흉내 내어 본 차이점

이러한 평문 전송과 암호화 전송의 차이를 애플리케이션 코드 레벨에서 직관적으로 이해하기 위해 간단한 시뮬레이션 테스트 코드를 작성해 보았습니다.

```typescript
// http-https-simulation.test.ts
import { describe, it, expect } from 'vitest';

// HTTP 방식 시뮬레이션: 데이터를 가공 없이 그대로 노출합니다.
const httpInsecureRequest = (data: string) => {
  return `Plaintext Payload: ${data}`;
};

// HTTPS 방식 시뮬레이션: 전송 전 데이터를 암호화(여기서는 Base64 인코딩으로 모의 구현)합니다.
const httpsSecureRequest = (data: string) => {
  // 실제 TLS/SSL은 훨씬 복잡한 비대칭/대칭 키 혼합 방식을 사용하지만, 원리 이해를 위해 단순 인코딩 적용
  const mockEncryptedData = Buffer.from(data).toString('base64'); 
  return `Encrypted Payload: ${mockEncryptedData}`;
};

describe('HTTP와 HTTPS의 데이터 보호 수준 차이 시뮬레이션', () => {
  const sensitiveData = 'user_password_123!!';

  it('HTTP 통신 시에는 민감한 데이터가 네트워크 상에 그대로 드러난다.', () => {
    const packet = httpInsecureRequest(sensitiveData);
    
    // 중간에 패킷을 가로챈 공격자의 입장이라고 가정했을 때, 비밀번호가 그대로 보입니다.
    expect(packet).toContain('user_password_123!!'); 
  });

  it('HTTPS 통신 시에는 데이터가 암호화 처리되어 원본을 알아볼 수 없다.', () => {
    const packet = httpsSecureRequest(sensitiveData);
    
    // 원본 데이터가 노출되지 않아 가로채어도 내용을 파악할 수 없습니다.
    expect(packet).not.toContain('user_password_123!!');
    
    // 암호화된 형태(Base64 모의 형태)로 안전하게 보호됨을 확인합니다.
    expect(packet).toContain(Buffer.from(sensitiveData).toString('base64'));
  });
});
```

위 코드는 실제 복잡한 네트워크 Handshake 과정을 아주 얕게 흉내 낸 것에 불과하지만, 통신 채널로 데이터가 방출되기 직전에 **'안전하게 포장하는 과정'**이 존재하는지 여부를 명확히 분간해 볼 수 있었습니다.

## 고민과 깨달음

단순히 URL 주소창에 'S' 한 글자가 추가된 것뿐이라고 생각했던 HTTPS 이면에는, 서로의 신뢰를 확인하고(인증서) 데이터를 복잡한 수학 알고리즘으로 잠그는(암호화) 치열하고 정교한 과정이 숨어 있었습니다.

지금까지는 브라우저나 클라이언트 라이브러리(`axios`, `fetch` 등)가 알아서 HTTPS 통신을 처리해주었기에 이 저수준의 네트워크 원리에 대해 무감각했던 것 같습니다. 인프라와 보안의 중요성을 새삼 느끼며, 앞으로는 단순히 라이브러리의 기능에 의존하는 것을 넘어 "그 기술의 이면에서 실제로 어떤 일이 벌어지고 있는지" 한 단계 깊이 들여다보는 호기심을 잃지 않아야겠다고 다짐합니다.
