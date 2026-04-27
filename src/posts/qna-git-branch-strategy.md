---
published: true
type: 'qna'
level: 'mid'
title: "Git 브랜치 전략 — Git Flow, GitHub Flow, Trunk-Based의 선택"
date: '2026-04-27'
categories: ['Engineering', 'DevOps', 'Process']
---

## Q1. 어떤 브랜치 전략들이 있고 어떻게 다른가요?

**A.** 3가지가 대표적입니다.

- **Git Flow**: main + develop + feature/release/hotfix. 명시적이지만 무겁고 CI/CD에 안 맞음. 데스크톱/모바일 앱처럼 출시 주기가 긴 제품에 적합.
- **GitHub Flow**: main + 짧은 feature 브랜치. PR 머지 후 자동 배포. SaaS/웹 서비스의 표준.
- **Trunk-Based Development(TBD)**: 모두가 main에 자주 통합. 브랜치 수명 수 시간~하루 + 피처 플래그. DORA 보고서의 **고성능 팀 표준**.

---

## Q2. 어떤 기준으로 전략을 선택하시나요?

**A.** 3가지를 봅니다.

1. **출시 주기**: 매일 배포면 GitHub Flow/TBD, 분기별 출시면 Git Flow.
2. **팀 크기/규모**: 작은 팀은 GitHub Flow가 단순. 큰 팀은 TBD가 통합 빈도를 올려 충돌 감소.
3. **CI/CD 성숙도**: TBD는 강한 자동 테스트와 피처 플래그가 전제.

"Git Flow가 표준"이라는 통념은 옛것입니다. 원저자도 웹 환경에는 부적합하다고 명시했습니다.

---

## Q3. Trunk-Based Development의 핵심은 무엇인가요?

**A.** **짧은 브랜치 + 피처 플래그**입니다.

- 모든 개발자가 main에 매일 통합.
- 브랜치는 수 시간~하루.
- 미완성 기능은 **피처 플래그**로 숨겨 main에 안전하게 머지.

장점: 머지 충돌 최소, 진정한 CI, 빠른 피드백.
단점: 강한 자동 테스트, 피처 플래그 인프라가 없으면 위험.

---

## Q4. Merge와 Rebase 중 무엇을 쓰시나요?

**A.** 상황별로 다릅니다.

- **작업 중 본인 브랜치**: `rebase`로 main을 따라가 깔끔한 히스토리.
- **PR을 main에 머지**: `squash merge`로 1 PR = 1 커밋. 히스토리 가독성.
- **공유 브랜치에 force push 금지**: rebase + force push는 다른 사람의 작업을 잃게 만듭니다.

`merge`는 머지 커밋이 남아 분기/통합이 명시적이라는 장점이 있고, `rebase`는 일자형 히스토리로 가독성이 좋습니다.

---

## Q5. PR 사이즈는 어느 정도로 유지하시나요?

**A.** **200~400줄 이하**가 경험적 한계선입니다. 그 이상은 리뷰 품질이 급락합니다.

큰 작업을 작게 쪼개는 방법:
- **사전 설계(RFC/ADR)** 로 방향 합의.
- **리팩토링 PR과 기능 PR 분리**.
- **단계별 PR + 피처 플래그**로 미완성 보호.

---

## Q6. 커밋 컨벤션은 어떤 걸 쓰시나요?

**A.** **Conventional Commits**가 사실상 표준입니다.

- `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:` 등 prefix.
- 자동 changelog 생성 + semantic versioning.
- semantic-release, Changesets 같은 도구로 릴리즈 자동화 가능.

추가로 **한 커밋 = 한 논리 변경** 원칙. 큰 PR도 작은 커밋으로 나누면 리뷰가 쉽습니다.

---

## Q7. 핫픽스와 롤백은 어떻게 처리하시나요?

**A.**

핫픽스:
- main에서 분기 → 빠르게 PR → 머지 후 배포.
- Git Flow에서는 hotfix 브랜치 + main/develop 양쪽 머지.

롤백:
- `git revert`로 커밋을 무효화하는 새 커밋.
- 또는 이전 빌드 재배포(blue-green이면 즉시).
- **데이터 마이그레이션이 있으면 별도 시나리오** — 단순 revert로는 데이터 일관성 회복 안 됨.

---

## Q8. 피처 플래그의 단점은 뭐가 있나요?

**A.** **기술 부채**입니다.

출시 후 정리를 안 하면 코드 안에 if/else 분기가 폭증해 가독성과 테스트가 망가집니다.

운영 원칙:
- **만료일 명시**: 플래그 생성 시 sunset 날짜 같이 기록.
- **주기적 청소**: 분기마다 만료된 플래그 제거 작업.
- **종류 분리**: release flag(임시), experiment flag(A/B 테스트), permission flag(사용자 권한)는 다른 lifecycle.

---

## Q9. 모노레포에서 브랜치 전략이 달라지나요?

**A.** 같은 전략을 쓰되 **영향 범위 제한**이 더 중요해집니다.

- **CODEOWNERS**: 디렉터리별 리뷰어 자동 지정.
- **변경 영향 분석**: Nx, Turborepo, Bazel로 변경된 패키지만 빌드/테스트.
- **RFC 문화**: 공유 라이브러리 변경은 사전 합의.

브랜치 이름 prefix로 영역 표시(`feat/web/...`, `fix/api/...`)도 흔한 컨벤션입니다.
