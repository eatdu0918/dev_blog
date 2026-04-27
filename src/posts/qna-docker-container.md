---
published: true
type: 'qna'
level: 'mid'
title: "Docker 컨테이너는 VM과 무엇이 다르고, 어떤 원리로 격리되나요?"
date: '2026-04-27'
categories: ['DevOps', 'Container', 'CS']
---

## Q1. 컨테이너와 VM의 가장 큰 차이는 뭔가요?

**A.** **OS 커널 공유 여부**입니다.

- **VM**: 하이퍼바이저 위에 게스트 OS 통째로. 무겁지만 강한 격리.
- **컨테이너**: 호스트 커널 공유 + **프로세스 격리**. 가볍고 빠르지만 격리는 약함.

| | VM | 컨테이너 |
|---|---|---|
| 시작 시간 | 초~분 | 밀리초 |
| 크기 | GB | MB |
| 격리 | 강함 | 약함 |
| 성능 | 가상화 오버헤드 | 거의 네이티브 |

---

## Q2. 컨테이너는 어떤 원리로 격리되나요?

**A.** 마법이 아니라 **리눅스 커널의 3가지 기술 조합**입니다.

1. **Namespace**: 프로세스가 보는 시스템 자원을 제한. PID, Mount, Network, UTS, IPC, User. 컨테이너 안에서 `ps`로 호스트 프로세스가 안 보이는 이유.
2. **cgroup**: CPU, 메모리, I/O, 네트워크 대역폭 한도.
3. **UnionFS(OverlayFS)**: 읽기 전용 이미지 레이어 + 쓰기 레이어 스택.

```bash
docker run --memory 512m --cpus 1.5 myimage
```

---

## Q3. Dockerfile에서 빌드 속도와 이미지 크기를 줄이는 핵심은?

**A.** 4가지 원칙입니다.

1. **레이어 캐시 활용**: 자주 안 바뀌는 명령(deps 설치)을 위에, 소스 복사를 아래에.
2. **Multi-stage build**: 빌드 의존성을 최종 이미지에서 제거.
3. **`.dockerignore`**: `node_modules`, `.git` 제외.
4. **베이스 이미지 선택**: alpine(작음) / distroless(보안) / slim 중 균형.

```dockerfile
FROM node:20 AS build
RUN npm ci && npm run build

FROM node:20-alpine
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
```

---

## Q4. 컨테이너 보안에서 무엇을 신경 쓰시나요?

**A.** VM 수준 격리가 아니므로 추가 도구가 필요합니다.

- **이미지 스캔**: Trivy, Snyk로 CVE 검사.
- **Non-root 유저**: `USER node`로 권한 최소화.
- **rootless 컨테이너**: 호스트 root 권한 없이 실행.
- **시크릿 관리**: 환경변수 평문 X → Secrets Manager.
- **runtime 강화**: gVisor, Kata Containers로 격리 강화.

커널 익스플로잇 시 호스트까지 영향이 가므로 다중 방어선이 필요합니다.

---

## Q5. Docker의 네트워크 모드를 설명해 주세요.

**A.** 4가지가 있습니다.

- **bridge**(기본): 가상 브리지 + 포트 매핑. 가장 흔함.
- **host**: 호스트 네트워크 직접 사용. 빠르지만 격리 약화.
- **none**: 네트워크 없음. 격리 테스트.
- **overlay**: 멀티 호스트 컨테이너 간 통신(Swarm/Kubernetes).

대부분 bridge로 충분하고, 성능이 중요한 데이터 처리는 host를 고려합니다.

---

## Q6. 컨테이너 데이터 영속성은 어떻게 보장하나요?

**A.** 컨테이너는 일회성이라 외부에 데이터를 둡니다.

- **Volume**: Docker 관리 디렉터리. 권장. 백업/마이그레이션 용이.
- **Bind mount**: 호스트 경로 매핑. 개발 환경 핫 리로드.
- **tmpfs**: 메모리 저장. 일시 캐시.

DB나 사용자 업로드 같은 영구 데이터는 반드시 volume 또는 외부 스토리지로 분리.

---

## Q7. Mac에서 Docker를 쓰면 왜 느리다고 느껴지나요?

**A.** Mac/Windows의 Docker Desktop은 **내부적으로 리눅스 VM을 띄우고 그 위에 컨테이너를 실행**합니다.

성능 영향:
- 호스트 ↔ VM 사이 파일시스템 마운트가 느림(특히 bind mount).
- 네트워크 hop이 추가.

해결: VirtioFS 활성화, gRPC FUSE, 또는 `:cached`/`:delegated` 마운트 옵션. 가장 빠른 방법은 **소스를 named volume에 두기**입니다.

---

## Q8. Kubernetes는 왜 Docker를 안 쓰나요?

**A.** K8s 1.24+ 에서 dockershim이 제거되고 **containerd**나 CRI-O를 직접 사용합니다.

이유:
- K8s는 CRI(Container Runtime Interface) 표준만 알면 되는데, Docker는 그 위에 추가 추상화 레이어가 있어 불필요.
- containerd가 Docker의 핵심 부분이라 같은 OCI 이미지를 그대로 사용 가능.

사용자 입장에서 빌드한 Docker 이미지가 K8s에서 그대로 동작하므로 실무 영향은 거의 없습니다.
