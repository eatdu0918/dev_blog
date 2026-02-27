---
title: "RDBMS와 NoSQL의 차이: 데이터의 형태와 확장성 사이에서의 고민"
date: "2026-02-27"
description: "프로젝트를 시작할 때마다 고민하게 되는 RDBMS와 NoSQL. 엄격한 스키마 구조와 유연한 문서 형태의 차이를 비교하고, 직접 TypeScript로 모델을 구현해보며 설계 철학을 학습한 과정을 나눕니다."
---

새로운 개인 프로젝트를 구상하며 데이터를 어떻게 저장할지 결정해야 하는 순간이 왔습니다. 그동안 습관적으로 익숙한 관계형 데이터베이스(RDBMS)를 선택해왔지만, 문득 "왜 NoSQL을 쓴다고들 하는 걸까?"라는 의문이 들었습니다. 유행하는 기술이라서 혹은 설정이 간단해 보여서가 아니라, 두 데이터베이스가 근본적으로 어떤 문제를 해결하기 위해 탄생했는지 명확하게 이해하고 싶어졌습니다.

오늘은 제가 RDBMS와 NoSQL의 핵심적인 구조적 차이를 학습하고, 이를 코드로 직접 흉내 내보며 얻은 깨달음을 기록해 보려 합니다.

<img src="/images/rdbms_vs_nosql.png" alt="RDBMS와 NoSQL 아키텍처 비교" style="max-width: 100%;" />
*정해진 표 형태를 따르는 RDBMS와 자유로운 형태를 가지는 NoSQL의 비교*

## 데이터를 바라보는 두 가지 관점

데이터베이스 시스템을 선택한다는 것은 곧 애플리케이션의 뼈대를 어떻게 구성할지 결정하는 일과 같습니다. RDBMS와 NoSQL은 데이터를 보관하고 확장하는 전략에 있어 완전히 다른 철학을 가지고 있었습니다.

### RDBMS: 엄격한 규칙과 관계의 힘

RDBMS(Relational Database Management System)는 엑셀 스프레드시트처럼 정해진 행(Row)과 열(Column)로 이루어진 테이블 구조를 가집니다. 데이터가 입력되기 전에는 반드시 스키마(Schema)라는 엄격한 설계도가 존재해야 하며, 이 틀에 맞지 않는 데이터는 아예 저장할 수 없습니다. 

또한 데이터의 무결성을 최우선으로 여기며, 여러 테이블 간의 관계(Relation)를 맺어 중복을 최소화합니다. 은행 시스템처럼 하나의 트랜잭션이 완벽하게 처리되거나 아예 실패해야만 하는 완벽한 정합성 환경에서 강력한 힘을 발휘합니다.

### NoSQL: 유연성과 수평적 확장의 자유

반면 NoSQL(Not Only SQL)은 규격화된 테이블을 강제하지 않습니다. 데이터를 흔히 JSON과 유사한 문서(Document)나 키-값(Key-Value) 형태로 저장합니다. 따라서 미리 스키마를 정의할 필요가 없으며, 개발 중간에 데이터 구조가 바뀌더라도 별도의 마이그레이션 작업 없이 새로운 필드를 자유롭게 추가할 수 있습니다.

이러한 느슨한 제약은 대규모 분산 환경에서 진가를 발휘합니다. 데이터를 여러 서버에 분산하여 저장하는 수평적 확장(Scale-out)이 RDBMS에 비해 훨씬 수월하기 때문에, 엄청난 양의 읽기/쓰기 작업이 발생하는 서비스나 구조가 자주 변경되는 초기 개발 단계에서 유리함을 배울 수 있었습니다.

## 스키마의 유무: 코드로 흉내 내어 보기

설명만으로는 와닿지 않았던 두 시스템의 차이를 TypeScript를 활용해 간단히 모델링하고, 테스트 코드를 통해 검증해 보았습니다.

```typescript
// db-model.test.ts
import { describe, it, expect } from 'vitest';

// 1. RDBMS를 모방한 엄격한 스키마 기반 모델 (TypeScript 인터페이스 활용)
interface UserTableRow {
  id: number;
  name: string;
  email: string;
}

class StrictRelationalMock {
  private table: UserTableRow[] = [];

  insert(data: any): UserTableRow {
    // 엄격한 타입 및 스키마 검증
    if (typeof data.id !== 'number' || typeof data.name !== 'string' || typeof data.email !== 'string') {
      throw new Error("Schema Validation Error: 데이터 형식이 테이블과 일치하지 않습니다.");
    }
    this.table.push(data);
    return data;
  }
}

// 2. NoSQL을 모방한 유연한 문서 모델 (Schemaless)
class FlexibleDocumentMock {
  private collection: Record<string, any>[] = [];

  insert(document: Record<string, any>) {
    // 별도의 스키마 검증 없이 자유롭게 추가 가능
    this.collection.push(document);
    return document;
  }
}

describe('Database Model Comparison', () => {
  it('RDBMS는 스키마에 어긋나는 데이터를 거부한다.', () => {
    const rdbms = new StrictRelationalMock();
    
    // 정상적인 데이터 삽입
    expect(() => rdbms.insert({ id: 1, name: "Alice", email: "alice@test.com" })).not.toThrow();
    
    // 스키마에 없는 필드 접근 시도 시 에러 발생
    expect(() => rdbms.insert({ id: 2, name: "Bob", age: 30 })).toThrowError("Schema Validation Error");
  });

  it('NoSQL은 다양한 형태의 데이터를 유연하게 수용한다.', () => {
    const nosql = new FlexibleDocumentMock();
    
    // 구조가 서로 다른 데이터도 같은 컬렉션에 자유롭게 저장
    const doc1 = nosql.insert({ id: "user-1", name: "Charlie" });
    const doc2 = nosql.insert({ id: "user-2", name: "David", preferences: { theme: 'dark' } });
    
    expect(doc1).toHaveProperty('name', 'Charlie');
    expect(doc2).toHaveProperty('preferences');
  });
});
```

위의 모의 구현 과정에서, RDBMS 방식은 초기 개발 속도가 조금 느리고 설계 고민이 깊지만 데이터의 정확성이 100% 보장된다는 안정감을 느꼈습니다. 반대로 NoSQL 방식은 당장 생각나는 대로 데이터를 넣어도 동작하므로 초기 개발 속도는 무척 빠르지만, 추후 애플리케이션 레벨에서 데이터의 유효성을 꼼꼼히 체크해주지 않으면 런타임에 예상치 못한 오류를 만날 수 있겠다는 경각심을 얻었습니다.

## 정답을 찾기보단 상황에 맞는 도구를 선택하는 눈

결국 RDBMS와 NoSQL 중 항상 더 우월한 정답은 없다는 평범하지만 중요한 진리를 체감했습니다. 데이터 구조의 안정성과 정밀한 관계가 중요하다면 RDBMS를, 데이터의 유연성과 빠른 스케일 아웃이 무엇보다 우선시된다면 NoSQL을 고려하는 것이 훌륭한 엔지니어링 접근일 것입니다.

이전에는 그저 익숙하다는 이유만으로 기술을 채택해 왔습니다. 그러나 구조적 차이를 밑바탕부터 뜯어보고 나니, 다음번 프로젝트에서 마주할 여러 기로에서는 "나의 애플리케이션이 어떤 형태의 데이터를 다루며, 어느 방향으로 확장될 것인가?"를 스스로에게 먼저 묻고 합리적인 결정을 내릴 수 있을 것 같습니다.
