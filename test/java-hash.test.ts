import { describe, it, expect } from 'vitest';

class SimpleHashTable<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private size: number;

  constructor(size: number = 10) {
    this.size = size;
    this.buckets = new Array(size).fill(null).map(() => []);
  }

  // Java의 hashCode() 역할을 단순화한 함수
  private getHash(key: K): number {
    let hash = 0;
    const strKey = String(key);
    for (let i = 0; i < strKey.length; i++) {
        hash = (hash << 5) - hash + strKey.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // 배열의 크기로 나머지 연산을 하여 버킷 인덱스를 구함
  private getIndex(key: K): number {
    return this.getHash(key) % this.size;
  }

  put(key: K, value: V): void {
    const index = this.getIndex(key);
    const bucket = this.buckets[index];
    
    // Java의 equals()처럼 동일한 키가 있는지 확인
    for (let i = 0; i < bucket.length; i++) {
        if (bucket[i][0] === key) {
            bucket[i][1] = value; // 값이 존재하면 업데이트
            return;
        }
    }
    // 해시 충돌(Hash Collision) 발생 시 체이닝(Chaining - LinkedList 방식)으로 추가
    bucket.push([key, value]);
  }

  get(key: K): V | undefined {
    const index = this.getIndex(key);
    const bucket = this.buckets[index];
    
    // 버킷 내부를 선형 탐색하여 동일한 키를 찾음
    for (let i = 0; i < bucket.length; i++) {
        if (bucket[i][0] === key) {
            return bucket[i][1];
        }
    }
    return undefined;
  }
}

describe('SimpleHashTable (Understanding Java HashMap internals)', () => {
    it('값을 정상적으로 저장하고 조회할 수 있어야 한다.', () => {
        const map = new SimpleHashTable<string, string>(5);
        map.put("사과", "빨강");
        map.put("바나나", "노랑");
        
        expect(map.get("사과")).toBe("빨강");
        expect(map.get("바나나")).toBe("노랑");
        expect(map.get("수박")).toBeUndefined();
    });
    
    it('해시 충돌이 발생해도 값은 유실되지 않아야 한다. (체이닝 확인)', () => {
        // 버킷 크기를 1로 강제하여 모든 키가 같은 버킷(인덱스 0)에서 충돌하도록 유도
        const map = new SimpleHashTable<string, string>(1);
        map.put("키1", "값1");
        map.put("키2", "값2");
        map.put("키3", "값3");
        
        expect(map.get("키1")).toBe("값1");
        expect(map.get("키2")).toBe("값2");
        expect(map.get("키3")).toBe("값3");
    });
});
