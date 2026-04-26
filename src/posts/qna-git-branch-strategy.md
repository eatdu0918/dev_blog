---
published: true
type: 'qna'
level: 'mid'
title: "Git 브랜치 전략 — Git Flow, GitHub Flow, Trunk-Based의 선택"
date: '2026-04-27'
categories: ['Engineering', 'DevOps', 'Process']
---

## 핵심 요약

- **Git Flow**: main + develop + feature/release/hotfix. 출시 주기가 길고 버전 관리가 중요한 제품.
- **GitHub Flow**: main + 짧은 feature 브랜치. SaaS / CD 환경에 단순하고 빠름.
- **Trunk-Based Development**: 단일 main + 짧은 브랜치(또는 직접 커밋) + 피처 플래그. 고성능 팀의 표준.

면접에서 자주 나옴. "어떤 전략을 쓰셨고 왜?" 답에 **출시 주기 / 팀 크기 / CI/CD 성숙도**가 들어가야 합니다.

## Git Flow

브랜치 5종류:
- `main`: 출시 버전.
- `develop`: 다음 출시 통합.
- `feature/*`: develop에서 분기, develop으로 머지.
- `release/*`: 출시 준비, 버그픽스만.
- `hotfix/*`: main의 긴급 픽스.

장점: 명시적, 버전 관리 명확.
단점: **브랜치 수명 길어 머지 충돌 多**, CI/CD와 잘 안 맞음, 학습 곡선.

적합: 데스크톱 앱, 라이브러리, 모바일 앱(앱스토어 출시).
부적합: 매일 배포하는 웹.

## GitHub Flow

- `main`은 항상 배포 가능.
- 작업은 `main`에서 분기 → PR → 리뷰 → 머지 → 배포.

장점: 단순, CI/CD 친화.
단점: 버전 관리/긴급 롤백 룰을 따로 정해야.

적합: 웹 서비스, SaaS, 작은~중간 팀.

## Trunk-Based Development (TBD)

- 모든 개발자가 `main`에 자주(매일) 통합.
- 브랜치는 **수 시간~하루** 수명.
- 미완성 기능은 **피처 플래그**로 숨김.

장점: 충돌 최소, 진정한 CI(통합), 빠른 피드백.
단점: 강한 자동 테스트 + 피처 플래그 인프라 필요.

DORA 보고서에서 **고성능 팀의 표준 패턴**으로 반복 확인.

## 머지 vs 리베이스

- **Merge**: 브랜치 히스토리 보존. 머지 커밋 발생.
- **Rebase**: 커밋을 기준 브랜치 위에 다시 쌓음. 깔끔한 히스토리. **공유 브랜치엔 금지**(force push 위험).

팀 컨벤션:
- main에 PR 머지 시 squash → 1 PR = 1 커밋.
- 작업 중에는 본인 브랜치 rebase로 main 따라가기.

## 커밋 컨벤션

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:` 등. 자동 changelog/semver.
- 한 커밋 = 한 논리 변경. 큰 PR도 작은 커밋으로 나눠 리뷰 친화.

## PR 사이즈

- 200~400줄 이하 권장. 그 이상은 리뷰 품질 저하.
- 큰 작업 = 사전 설계 + 단계별 PR + 피처 플래그.

## CI/CD와의 결합

- 모든 PR에 테스트/린트/타입체크.
- main 머지 시 자동 배포(또는 staging).
- 운영은 카나리/블루그린/롤링.

## 핫픽스/롤백 전략

- 핫픽스 브랜치 또는 main에 직접 PR + 패스트 머지.
- 롤백: revert 커밋 또는 이전 빌드 재배포. 데이터 마이그레이션이 있으면 별도 시나리오.

## 자주 헷갈리는 디테일

- "Git Flow가 표준"이라는 통념은 옛것. 원저자도 웹 환경엔 부적합하다고 명시.
- main 보호 규칙(직접 push 금지, 필수 리뷰, 필수 체크)은 어떤 전략이든 기본.
- 모노레포에서는 영향 범위 제한 + 코드 오너 + RFC가 더 중요.

## 면접 follow-up

- "충돌이 자주 나면?" → 브랜치 수명 단축 + 모듈 경계 설계 + 대규모 리팩토링은 별도 PR로 분리.
- "피처 플래그의 단점?" → 기술 부채. 출시 후 정리 안 하면 코드 분기 폭발. 만료일 명시.
- "릴리즈 노트를 자동화?" → Conventional Commits + semantic-release 또는 Changesets.
