---
published: true
title: "Java Hash의 내부 동작 원리: 해시 테이블을 직접 구현하며 깨달은 것들"
description: "Java의 HashMap과 hashCode()가 내부적으로 어떻게 동작하는지, 그 원리를 파헤치고 TypeScript로 직접 해시 테이블을 구현하며 학습한 과정을 공유합니다."
date: "2026-03-12"
tags: ["Java"]
---

# Java Hash의 내부 동작 원리: 해시 테이블을 직접 구현하며 깨달은 것들

![Java Hash 동작 원리](/public/images/understanding-java-hash.png)

Java로 개발을 하다 보면 `HashMap`이나 `HashSet`을 정말 숨 쉬듯이 사용하게 된다. "빠르다", "키-값 쌍으로 저장한다" 정도의 얄팍한 지식만으로도 API를 호출하는 데는 아무런 지장이 없었다. 

하지만 얼마 전, 문득 내 코드에서 `hashCode()`와 `equals()`를 재정의(Override)해야 하는 상황을 마주했고, IDE가 자동 생성해 주는 코드를 영혼 없이 복사/붙여넣기 하던 내 모습을 발견했다. 도대체 Java의 Hash는 내부적으로 어떻게 동작하길래 이 두 메서드가 세트처럼 묶여 다녀야 하는 걸까? 이 궁금증을 해결하기 위해 한 걸음 더 깊이, 직접 그 메커니즘을 파헤치고 원리를 모방해 보기로 했다.

---

## 1. Hash란 도대체 무엇인가?

우선 개념부터 정리해 볼 필요가 있었다. 데이터가 많아질수록 배열(Array)처럼 처음부터 끝까지 데이터를 찾는 방식(선형 탐색)은 성능에 한계를 보인다. 

이를 해결하기 위해 등장한 개념이 **해시 테이블(Hash Table)**이다. 데이터를 저장할 때, 데이터의 '키(Key)' 자체를 특별한 공식(해시 함수, Hash Function)에 통과시켜 특정한 **숫자(인덱스)**로 바꾸고, 그 숫자에 해당하는 위치에 바로 데이터를 저장하는 기법이다. 이렇게 하면 데이터를 찾을 때 단 한 번의 연산($O(1)$)으로 위치를 찾아낼 수 있게 된다.

Java에서는 이 특별한 공식의 역할을 객체의 `hashCode()` 메서드가 담당한다.

---

## 2. HashMap의 내부 여정: 키부터 버킷까지

Java `HashMap`에 데이터를 `put(key, value)` 할 때 벌어지는 일련의 과정은 다음과 같다.

1. **`hashCode()` 호출**: 가장 먼저 키 객체의 `hashCode()`를 호출하여 고유한 정수 값을 얻어낸다.
2. **인덱스 계산**: 이 해시값을 내부 저장 공간(버킷 배열)의 크기로 나머지 연산(`%`)하여, 배열의 몇 번째 칸(Index)에 들어갈지 결정한다.
3. **버킷(Bucket) 저장**: 계산된 인덱스의 칸에 키와 값을 저장한다.

### "그런데 만약 자리가 겹친다면?" (해시 충돌)

이 여정의 핵심은 바로 **해시 충돌(Hash Collision)**을 어떻게 해결하느냐에 있었다. 아무리 훌륭한 해시 함수를 쓰더라도, 서로 다른 키가 결국 같은 인덱스를 가리키게 되는 상황이 필연적으로 발생한다.

Java는 이 문제를 **체이닝(Chaining)** 방식으로 해결한다. 자리가 겹치면 기존에 있던 데이터에 새로운 데이터를 연결 리스트(Linked List) 형태로 주렁주렁 매달아 두는 방식이다. (Java 8부터는 충돌이 많아지면 Red-Black Tree로 변환하여 성능을 최적화하지만, 근본적인 원리와 시작은 연결 리스트다.)

이때 바로 `equals()`가 필요해진다. 같은 인덱스 칸(버킷) 안에 여러 데이터가 연결 리스트로 매달려 있을 때, 내가 진짜로 찾고자 하는 키가 무엇인지 하나하나 비교하며 찾아야 하기 때문이다. **이것이 `hashCode()`와 `equals()`가 반드시 함께 정의되어야 하는 이유였다.**

---

## 3. 직접 만들어보며 증명하기

개념만으로는 부족해서, 내가 주력으로 사용하는 TypeScript를 이용해 Java Hash 동작의 핵심 원리를 모방한 간이 해시 테이블을 만들어 테스트해 보았다.

```typescript
// test/java-hash.test.ts 중 일부 발췌

class SimpleHashTable<K, V> {
  // 데이터를 담을 버킷(배열의 배열 - 체이닝 구조)
  private buckets: Array<Array<[K, V]>>;
  private size: number;

  constructor(size: number = 10) {
    this.size = size;
    this.buckets = new Array(size).fill(null).map(() => []);
  }

  // 1. Java의 hashCode() 역할을 단순화한 내부 해시 함수
  private getHash(key: K): number {
    let hash = 0;
    const strKey = String(key);
    for (let i = 0; i < strKey.length; i++) {
        hash = (hash << 5) - hash + strKey.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
  }

  // 2. 인덱스 계산 (해시값 % 배열 크기)
  private getIndex(key: K): number {
    return this.getHash(key) % this.size;
  }

  put(key: K, value: V): void {
    const index = this.getIndex(key);
    const bucket = this.buckets[index];
    
    // 3. 동일한 키가 있는지 확인 (Java의 equals() 역할)
    for (let i = 0; i < bucket.length; i++) {
        if (bucket[i][0] === key) {
            bucket[i][1] = value; // 덮어쓰기
            return;
        }
    }
    // 4. 해시 충돌 시 체이닝(배열 push로 간략화)
    bucket.push([key, value]);
  }

  get(key: K): V | undefined {
    const index = this.getIndex(key);
    const bucket = this.buckets[index];
    
    // 버킷 안에서 해당하는 진짜 키를 탐색
    for (let i = 0; i < bucket.length; i++) {
        if (bucket[i][0] === key) {
            return bucket[i][1];
        }
    }
    return undefined;
  }
}
```

이 코드를 직접 작성하고 테스트 케이스를 돌려보며, 나는 내 눈으로 확인하고 싶었던 과정을 명확히 볼 수 있었다. 일부러 버킷 크기를 `1`로 제한하여 모든 키가 같은 버킷에 쏟아지게(무한 충돌) 만들더라도, 데이터는 서로 유실되지 않고 버킷 내에서 안전하게 체이닝으로 쌓였다. 다시 꺼낼 때도 완벽하게 제 값을 찾아 반환했다.

---

## 💡 마치며: 보이지 않던 블랙박스를 열다

지금까지 Java의 `HashMap`은 나에게 일종의 마법 상자였다. 그저 던져 넣으면 알아서 척척 빼주는 완벽한 도구 말이다. 하지만 이번 학습을 통해 그 상자의 뚜껑을 열어보니, 그 안에는 `hashCode()`라는 길잡이와 체이닝이라는 안전장치, 그리고 `equals()`라는 최종 검문소가 정교하게 맞물려 돌아가고 있었다.

내가 매일 사용하는 도구의 원리를 이해하는 것. 그것은 단순한 호기심 충족을 넘어, 예상치 못한 성능 저하나 버그를 마주했을 때 대응할 수 있는 단단한 기초 체력이 되어줄 것이라 믿어 의심치 않는다. 오늘부터는 IDE가 무심코 내뿜는 `hashCode()`와 `equals()` 코드를 조금은 더 애정 어린 시선으로 바라볼 수 있을 것 같다.
