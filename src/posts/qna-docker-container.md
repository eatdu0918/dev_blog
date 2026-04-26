---
published: true
type: 'qna'
level: 'mid'
title: "Docker 컨테이너는 VM과 무엇이 다르고, 어떤 원리로 격리되나요?"
date: '2026-04-27'
categories: ['DevOps', 'Container', 'CS']
---

## 핵심 요약

- **VM**: 하이퍼바이저 위에 **게스트 OS 통째로**. 무거움, 강한 격리.
- **컨테이너**: 호스트 커널 공유 + **프로세스 격리**. 가벼움, 빠른 시작.

리눅스 컨테이너의 격리는 마법이 아니라 **namespace + cgroup + UnionFS**의 조합입니다.

## 컨테이너의 3가지 핵심 기술

### Namespace (격리)
프로세스가 보는 시스템 자원을 제한:
- **PID**: 프로세스 ID 공간.
- **Mount**: 파일시스템 뷰.
- **Network**: 네트워크 인터페이스, 라우팅.
- **UTS**: 호스트네임.
- **IPC**: 프로세스 간 통신.
- **User**: UID/GID.
- **Cgroup**: 자기 cgroup 위치.

컨테이너 안에서 `ps`로 호스트 프로세스가 안 보이는 이유.

### cgroup (자원 제한)
CPU, 메모리, I/O, 네트워크 대역폭 한도. cgroup v2로 통합 진행 중.

```bash
docker run --memory 512m --cpus 1.5 ...
```

### UnionFS (이미지 레이어)
- 이미지는 **읽기 전용 레이어들의 스택** + 컨테이너 시 쓰기 레이어.
- 같은 베이스 이미지면 디스크 공유.
- OverlayFS가 사실상 표준.

## 이미지 vs 컨테이너

- **이미지**: 빌드 결과물. 불변.
- **컨테이너**: 이미지에서 실행되는 인스턴스.

이미지는 Dockerfile로 빌드:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "server.js"]
```

## Dockerfile 모범 사례

- **레이어 캐시 활용**: 자주 바뀌지 않는 명령(deps 설치)을 **위에**, 자주 바뀌는 명령(소스 복사)을 **아래에**.
- **Multi-stage build**: 빌드 의존성 제거. 최종 이미지에는 런타임만.
  ```dockerfile
  FROM node:20 AS build
  RUN npm ci && npm run build
  FROM node:20-alpine
  COPY --from=build /app/dist ./dist
  ```
- **`.dockerignore`**: node_modules, .git 제외.
- **Non-root 유저**: `USER node`로 권한 최소화.
- **베이스 이미지**: alpine(작음) vs distroless(보안) vs slim. 디버깅 vs 보안 균형.

## 컨테이너 vs VM

| | VM | 컨테이너 |
|---|---|---|
| 시작 시간 | 초~분 | 밀리초 |
| 크기 | GB | MB |
| 격리 | 강함(다른 OS 가능) | 약함(같은 커널) |
| 보안 | 강함 | 추가 도구 필요 |
| 성능 | 가상화 오버헤드 | 거의 네이티브 |

## 보안 고려

- 컨테이너 = VM 수준 격리 X. 커널 익스플로잇 발생 시 호스트까지.
- **runtime**: gVisor, Kata Containers로 격리 강화.
- **이미지 스캔**: Trivy, Snyk로 CVE 검사.
- **rootless 컨테이너**: 호스트 root 권한 없이 실행.
- 환경변수에 시크릿 평문 X — Secrets Manager 사용.

## 네트워크 모드

- **bridge**(기본): 가상 브리지 + 포트 매핑.
- **host**: 호스트 네트워크 직접 사용. 빠르지만 격리 약화.
- **none**: 네트워크 없음.
- **overlay**: 멀티 호스트 컨테이너 간 통신(Swarm/Kubernetes).

## 데이터 영속성

컨테이너는 일회성. 데이터는 외부에:
- **Volume**: Docker 관리 디렉터리. 권장.
- **Bind mount**: 호스트 경로 매핑. 개발 시 유용.
- **tmpfs**: 메모리. 캐시/일시.

## 자주 헷갈리는 디테일

- 컨테이너는 **OS를 통째로 격리하지 않음**. 커널은 호스트 것.
- "Docker = 컨테이너"는 단순화. containerd, CRI-O 등 다양한 런타임. Docker는 가장 유명한 사용자 도구.
- Mac/Windows의 Docker Desktop은 내부적으로 **리눅스 VM**을 띄우고 그 위에 컨테이너 실행.

## 면접 follow-up

- "컨테이너 안에서 호스트 PID를 볼 수 있나?" → namespace 분리로 안 보임. `--pid=host`로 의도적 공유 가능.
- "이미지 빌드가 느려졌다면?" → 레이어 순서 점검, `.dockerignore`, multi-stage, 캐시 마운트(BuildKit).
- "Kubernetes는 왜 도커가 아닌 containerd를?" → CRI 표준 + 도커는 추가 추상화 레이어. K8s 1.24+ dockershim 제거.
