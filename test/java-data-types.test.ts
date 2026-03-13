import { describe, it, expect } from 'vitest';

/**
 * Java의 기본형(Primitive)과 참조형(Reference)의 메모리 동작 방식을 
 * JS/TS 환경에서 시뮬레이션하여 비교 검증합니다.
 */
describe('Java Data Types Behavior Simulation (Value vs Reference)', () => {
    
    // 1. Primitive Type (값 복사) 시뮬레이션
    it('should copy by value for primitive-like types (number, boolean, string)', () => {
        let primitiveA = 100;
        let primitiveB = primitiveA; // 값 자체가 복사됨
        
        primitiveB = 200; // 복사본을 수정
        
        // 원본에는 영향을 주지 않아야 함
        expect(primitiveA).toBe(100);
        expect(primitiveB).toBe(200);
    });

    // 2. Reference Type (주소 복사) 시뮬레이션
    it('should copy by reference for object types', () => {
        const referenceA = { hp: 100 };
        const referenceB = referenceA; // 주소가 복사됨 (같은 객체 참조)
        
        referenceB.hp = 50; // 참조를 통해 객체 필드 수정
        
        // 두 변수가 같은 객체를 가리키므로 원본도 변경된 것으로 보임
        expect(referenceA.hp).toBe(50);
        expect(referenceA).toBe(referenceB); // 같은 참조 주소임을 확인
    });

    // 3. Null Reference (참조형의 특권(?)이자 고충)
    it('should allow reference types to be null, but not primitives', () => {
        // TS에서는 엄격한 모드에서 null 체크를 하지만, 개념적으로 참조형만 null이 될 수 있음
        let obj: { name: string } | null = { name: "Java" };
        obj = null;
        
        expect(obj).toBeNull();
        
        // let num: number = null; // 기본형 성격의 number는 null을 가질 수 없음 (strict 모드 시)
    });

    // 4. Comparison Behavior (== vs equals())
    it('should demonstrate that object comparison checks reference identity', () => {
        const obj1 = { id: 1 };
        const obj2 = { id: 1 };
        
        // Java의 == 연산자처럼, 내용은 같아도 주소가 다르면 다르다고 판단 (Reference Equality)
        expect(obj1).not.toBe(obj2); 
        
        // 런타임 값 비교 (Java의 equals() 역할)
        expect(obj1.id).toEqual(obj2.id);
        expect(obj1).toEqual(obj2); // Vitest의 toEqual은 deep equality를 체크함
    });
});
