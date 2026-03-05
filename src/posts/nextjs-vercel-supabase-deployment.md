---
published: true
title: 'Next.js + Supabase + Vercel: 내가 선택한 서버리스 풀스택 생태계'
date: '2026-03-05'
categories: ['Next.js', 'Vercel', 'Supabase', 'Deployment']
---

# Next.js + Supabase + Vercel: 내가 선택한 서버리스 풀스택 생태계

블로그를 구축하기로 마음먹었을 때 가장 고민했던 지점은 "어떻게 하면 가장 적은 운영 비용으로, 가장 현대적인 개발 경험을 유지할 수 있을까?"였다. 이 고민의 끝에 도달한 조합이 바로 Next.js, Vercel, 그리고 Supabase로 이어지는 서버리스 스택이다.

하지만 단순히 "좋다니까 쓴다"는 생각으로 덤볐다가, 환경 설정과 배포 과정에서 예상치 못한 복병들을 만나며 꽤나 고전했다. 그 과정에서 배운 것들을 정리해본다.

---

![Vercel and Supabase Architecture](/public/images/vercel_supabase_architecture.png)

## 1. 왜 이 조합이었나?

서버를 직접 관리하는 것은 즐거운 일이지만, 블로그처럼 콘텐츠에 집중해야 하는 프로젝트에서는 오버헤드가 될 수 있다고 판단했다.

- **Vercel**: Next.js의 고향이자, 무중단 배포와 Edge Function 지원이 완벽하다.
- **Supabase**: PostgreSQL을 기반으로 하면서도 Firebase와 같은 편의성을 제공한다. 특히 서버리스 환경에서의 연결 관리 기능이 강력하다.
- **Prisma**: Type-safe한 쿼리 작성은 이제 내 개발 과정에서 떼어놓을 수 없는 필수 요소가 되었다.

## 2. 배포 과정에서 마주한 기술적 도전

로컬 환경에서는 `.env` 파일 하나로 모든 것이 해결되었지만, 배포 환경(Vercel)은 달랐다.

### 연결 방식의 이원화 (Pooler vs Direct)

서버리스 함수는 수시로 생성되고 사라진다. 이때마다 데이터베이스에 새 연결을 맺으면 DB 커넥션이 순식간에 고갈된다. 이를 위해 Supabase의 Connection Pooler를 사용해야 했다.

```env
# Vercel Environment Variables 설정 예시

# Transaction Mode (애플리케이션용, 6543 포트)
DATABASE_URL="postgresql://postgres.[REF]:[PW]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session Mode (Prisma Migration용, 5432 포트)
DIRECT_URL="postgresql://postgres.[REF]:[PW]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

Prisma가 마이그레이션을 수행할 때는 직접 연결(`DIRECT_URL`)이 필요하고, 실제 서비스가 돌아갈 때는 풀러를 통한 연결(`DATABASE_URL`)이 필요하다는 점을 이해하는 데 시간이 조금 걸렸다.

### Vercel 빌드 시 Prisma Client 생성 문제

Vercel에서 배포가 이루어질 때, 종종 `PrismaClient`를 찾을 수 없다는 에러를 만났다. 이는 빌드 과정에서 Prisma Client가 생성되지 않았기 때문이었다. `package.json`의 빌드 스크립트를 다음과 같이 수정하며 해결의 실마리를 찾았다.

```bash
# package.json
"scripts": {
  "build": "prisma generate && next build",
  "postinstall": "prisma generate"
}
```

빌드 명령 전후로 `prisma generate`를 명시적으로 실행해줌으로써, 배포 환경에서도 항상 최신의 타입 정의를 참조할 수 있게 되었다.

## 3. 안정적인 서비스를 위한 검증 코드

배포 전, 필수 환경 변수가 제대로 설정되었는지 확인하는 간단한 검증 로직을 작성해보았다. 사소해 보이지만 배포 실패 후 원인을 찾는 시간을 줄여주었다.

```typescript
// src/lib/env-validator.ts
export function validateEnv() {
  const required = ['DATABASE_URL', 'DIRECT_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`필수 환경 변수가 누락되었습니다: ${missing.join(', ')}`);
  }
}
```

이 로직을 `next.config.ts`나 서버 사이드 진입점에서 실행하도록 구성하여 배포 안정성을 높였다.

---

## 마치며

기술 스택을 선택하고 연동하는 과정은 단순히 도구를 연결하는 것을 넘어, 그 도구가 가진 철학과 한계를 이해하는 과정이었다. Vercel과 Supabase는 강력하지만, 그만큼 정교한 설정이 뒷받침되어야 제 성능을 발휘한다는 것을 깨달았다.

이제 인프라 걱정 없이 글을 쓸 수 있는 토대가 마련되었다. 이 탄탄한 기초 위에 하나씩 나의 기록들을 쌓아나가는 즐거움을 누려보려 한다.
