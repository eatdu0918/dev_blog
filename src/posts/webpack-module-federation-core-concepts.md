---
published: true
title: "런타임 마이크로 프런트엔드의 정점: Webpack Module Federation의 심층 동작 원리와 설계"
description: "Webpack 5 Module Federation의 핵심 아키텍처를 분석하고, 런타임 의존성 공유(Shared Scope)와 비동기 통합(Async Boundary)이 주는 기술적 이점을 탐구합니다."
date: "2026-03-24"
tags: ["Architecture", "Frontend", "Webpack", "Module Federation"]
---

# 런타임 마이크로 프런트엔드의 정점: Webpack Module Federation의 심층 동작 원리와 설계

![Webpack Module Federation 아키텍처 도식](/public/images/webpack-module-federation-architecture.png)

웹 애플리케이션의 규모가 거대해질수록 하나의 거대한 저장소(Monorepo)나 모놀리스(Monolith) 구조는 관리의 한계에 봉착하곤 합니다. 여러 팀이 독립적으로 배포하면서도 사용자에게는 하나의 서비스처럼 느껴지게 하는 '마이크로 프런트엔드'는 이제 필수적인 선택지가 되었습니다. 그중에서도 Webpack 5에서 도입된 **Module Federation**은 빌드 타임의 결합을 런타임의 유연한 결합으로 전환하며 가장 완성도 높은 통합 방식을 제안합니다.

이번 학습에서는 Module Federation이 내부적으로 어떻게 동작하며, 특히 까다로운 '의존성 버전 관리'를 런타임에 어떻게 해결하는지 그 깊숙한 곳을 들여다보았습니다.

---

## 1. Module Federation의 3단계 통합: Host, Remote, Shared

Module Federation은 단순히 코드를 불러오는 것을 넘어, 각 애플리케이션이 서로의 자원을 '연맹(Federation)'처럼 공유하는 구조를 가집니다.

- **Host (Main Application)**: 런타임에 필요한 원격 모듈을 불러와 전체 애플리케이션의 뼈대를 형성합니다.
- **Remote (Exposed Application)**: 내부의 컴포넌트나 비즈니스 로직을 외부에서 사용할 수 있도록 '노출(Expose)'하는 주체입니다.
- **Shared Scope (공유 영역)**: 모든 연맹 구성원(Host & Remote)이 공유하는 전역 의존성 저장소입니다. `react`나 `react-dom` 같은 고비용 라이브러리를 단 한 번만 로드하도록 보장하는 핵심 장치입니다.

---

## 2. 'RemoteEntry.js': 연맹의 안내 지도

Remote 애플리케이션을 빌드하면 `remoteEntry.js`라는 작은 매니페스트 파일이 생성됩니다. 이 파일은 연맹의 인터페이스를 정의합니다.

- **Exposed Modules**: 어떤 파일을 어떤 이름으로 가져갈 수 있는지 기술합니다.
- **Dependency Requirements**: 해당 모듈이 실행되기 위해 어떤 버전의 라이브러리가 필요한지 명시합니다.

Host는 런타임에 이 파일을 먼저 읽어 들여, Remote가 가진 모듈의 주소와 필요한 의존성을 파악합니다. 이 정보는 이후 **연맹 런타임(Federation Runtime)**이 의존성 버전을 협상하는 기초 자료가 됩니다.

---

## 3. 런타임 의존성 협상(Dependency Negotiation) 알고리즘

Module Federation의 가장 놀라운 지점은 서로 다른 애플리케이션이 요구하는 의존성 버전을 실시간으로 맞춰가는 과정입니다.

1. **Initialization**: 모든 참여 앱은 자신의 `shared` 설정을 `__webpack_share_scopes__`라는 글로벌 객체에 등록합니다.
2. **Resolution Logic**: 
   - 만약 특정 라이브러리가 `singleton: true`로 설정되어 있다면, 연맹 전체에서 가장 높은 호환 버전을 단 하나만 선택합니다.
   - `requiredVersion` 범위를 벗어난다면, Webpack은 경고를 띄우거나 해당 앱이 스스로 자신의 버전을 로드하도록(Fallback) 처리합니다.

이 과정 덕분에 팀마다 조금씩 다른 React 마이너 버전을 사용하더라도, 런타임에는 하나의 React 인스턴스만 유지되어 메모리 낭비와 상태 불일치 문제를 방지할 수 있음을 배웠습니다.

---

## 4. 비동기 부트스트랩(Async Bootstrap)의 필연성

Module Federation 앱의 입구(`index.js`)가 항상 비동기 `import()` 구조인 이유는 무엇일까요?

```javascript
// index.js
import('./bootstrap');
```

이는 **동기적 실행을 지연시키기 위함**입니다. 브라우저가 첫 번째 코드를 실행하기 전에, 연맹 런타임은 모든 원격지의 매니페스트를 가져오고 의존성 협상을 마쳐야 합니다. 만약 동기적으로 실행된다면 협상이 끝나기도 전에 모듈을 호출하게 되어 에러가 발생하게 됩니다. 이 '비동기 경계'가 Webpack에게 준비할 시간을 주는 중요한 패턴임을 깨달았습니다.

---

## 5. 실전 구현 및 시뮬레이션

Webpack 내부의 협상 로직을 이해하기 위해, `Vitest`를 활용해 간단한 버전 해상도(Resolution) 시뮬레이터를 구현해 보았습니다.

### 의존성 해상도 시뮬레이터 (Mock)

```typescript
// src/examples/federation-resolution.ts
export type VersionMap = { [version: string]: { loaded: boolean } };

export function negotiateVersion(
  scope: { [lib: string]: VersionMap },
  libName: string,
  required: string,
  options: { singleton?: boolean }
): string {
  const versions = scope[libName];
  if (!versions) throw new Error(`${libName} not found in scope`);

  const sortedVersions = Object.keys(versions).sort((a, b) => b.localeCompare(a));
  
  if (options.singleton) {
    // 싱글톤일 때는 범위와 상관없이 가장 높은 버전을 우선 고려 (단순화)
    return sortedVersions[0];
  }

  // 요구 사항에 맞는 버전 탐색
  const matched = sortedVersions.find(v => v.startsWith(required.replace('^', '')));
  if (!matched) throw new Error(`Incompatible version for ${libName}`);
  
  return matched;
}
```

### 시뮬레이션 테스트

```typescript
// test/federation-resolution.test.ts
import { describe, it, expect } from 'vitest';
import { negotiateVersion, VersionMap } from '../src/examples/federation-resolution';

describe('Module Federation 버전 협상 시뮬레이션', () => {
  const scope = {
    react: {
      '18.2.0': { loaded: false },
      '17.0.2': { loaded: false },
    }
  };

  it('싱글톤 설정 시 가장 높은 버전을 선택해야 함', () => {
    const selected = negotiateVersion(scope, 'react', '^17.0.0', { singleton: true });
    expect(selected).toBe('18.2.0');
  });

  it('일반 설정 시 호환되는 범위 내 최신 버전을 선택해야 함', () => {
    const selected = negotiateVersion(scope, 'react', '^17.0.0', { singleton: false });
    expect(selected).toBe('17.0.2');
  });
});
```

---

## 💡 마치며: 관리의 복잡성을 넘어선 확장성

Module Federation을 심도 있게 탐구하며, 마이크로 프런트엔드가 단순히 코드를 쪼개는 것 이상으로 **'분산된 시스템의 런타임 오케스트레이션'**에 가깝다는 점을 느꼈습니다. 

물론 런타임 결함의 전파 가능성이나 복잡한 빌드 설정이라는 기회비용이 존재하지만, 독립적인 배포 속도를 유지하면서도 의존성 최적화를 포기하지 않는 이 방식은 대규모 조직에 매우 매력적인 도구임이 틀림없습니다. 다음 단계로는 런타임 에러를 방지하기 위한 **Federation 에러 바운더리(Error Boundary)** 전략과 모듈 로딩 성능 최적화에 대해 고민해 보고자 합니다.
