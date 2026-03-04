---
published: true
title: 'Prisma와 Supabase 연동 시 발생하는 연결 오류 해결기'
date: '2026-03-04'
categories: ['Next.js', 'Database']
---

# Prisma와 Supabase 연동 시 발생하는 연결 오류 해결기

Next.js 프로젝트에서 Prisma ORM을 사용해 Supabase 데이터베이스에 연결하려고 할 때, 종종 당혹스러운 에러를 마주하게 됩니다. 이번 작업 중 발생했던 `Tenant or user not found` 에러와 그 해결 과정을 기록으로 남깁니다.

---

## 1. 문제의 발단: `Tenant or user not found`

Prisma를 통해 마이그레이션을 실행하거나 데이터를 가져오려 할 때 다음과 같은 에러가 발생했습니다:

```bash
PrismaClientInitializationError: 
Invalid `prisma.comment.findMany()` invocation:
Can't reach database server at `[your-project-ref].pooler.supabase.com:5432`
...
FATAL: Tenant or user not found
```

이 에러는 주로 **Supabase의 Connection Pooling 설정**이나 **연결 문자열(Connection String)**이 올바르지 않을 때 발생합니다.

## 2. 해결 방법: `DATABASE_URL`과 `DIRECT_URL`의 분리

Supabase는 서버리스 환경(Vercel 등)에서 데이터베이스 연결 효율을 높이기 위해 **PgBouncer**라는 커넥션 풀러를 제공합니다. Prisma를 사용할 때는 두 종류의 URL을 모두 설정해주는 것이 권장됩니다.

### 1) `.env` 파일 설정

> [!CAUTION]
> **중요:** `.env` 파일은 절대로 Git에 커밋하지 마세요. `.gitignore`에 `.env`가 포함되어 있는지 반드시 확인해야 합니다.

```env
# 트랜잭션 모드 (커넥션 풀링용, 포트 6543)
DATABASE_URL="postgresql://postgres.[your-project-ref]:[your-password]@aws-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# 세션 모드 (마이그레이션 등 직접 연결용, 포트 5432)
DIRECT_URL="postgresql://postgres.[your-project-ref]:[your-password]@aws-[region].pooler.supabase.com:5432/postgres"
```

### 2) `schema.prisma` 설정

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- **`DATABASE_URL`**: 애플리케이션 실행 시 사용됩니다. 포트 번호가 보통 `6543`이며, 뒤에 `?pgbouncer=true` 파라미터를 붙여야 합니다.
- **`DIRECT_URL`**: `prisma migrate` 등을 실행할 때 데이터베이스에 직접 연결하기 위해 사용됩니다. 포트 번호는 보통 `5432`입니다.

## 3. 그 외 체크리스트

만약 위 설정으로도 해결되지 않는다면 다음 사항을 확인해 보세요:

- **비밀번호 특수 문자**: 데이터베이스 비밀번호에 특수 문자가 포함되어 있다면, URL 인코딩을 거쳐야 합니다. (예: `@` 등)
- **네트워크 접근 제한**: Supabase 대시보드에서 IP 화이트리스트(Allow list)가 설정되어 있지 않은지 확인합니다.
- **Region 확인**: 연결 문자열에 포함된 리전 정보가 실제 프로젝트 리전과 일치하는지 확인합니다.

---

## 마치며

데이터베이스 연결 설정은 한 번만 제대로 해두면 되지만, 처음 맞닥뜨렸을 때는 원인을 찾기 쉽지 않습니다. 이번 해결 과정이 Supabase와 Prisma를 연동하는 다른 분들에게 도움이 되길 바랍니다!
