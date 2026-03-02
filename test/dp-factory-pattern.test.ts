import { describe, it, expect } from 'vitest';

// 1. 공통 인터페이스
interface Shape {
    draw(): string;
    getArea(): number;
}

// 2. 구체적인 클래스 구현
class Circle implements Shape {
    constructor(private radius: number) { }

    draw(): string {
        return '원 그리기 완료';
    }

    getArea(): number {
        return Math.PI * this.radius * this.radius;
    }
}

class Square implements Shape {
    constructor(private side: number) { }

    draw(): string {
        return '정사각형 그리기 완료';
    }

    getArea(): number {
        return this.side * this.side;
    }
}

// 3. 팩토리 클래스 정의
class ShapeFactory {
    // 어떤 클래스의 인스턴스를 만들지 구체적으로 알 필요 없이 타입 정보만으로 생성
    static createShape(type: 'circle' | 'square', params: number[]): Shape {
        switch (type) {
            case 'circle':
                return new Circle(params[0]);
            case 'square':
                return new Square(params[0]);
            default:
                throw new Error('지원하지 않는 도형입니다.');
        }
    }
}

describe('Factory Pattern', () => {
    it('팩토리를 통해 원(Circle) 객체를 생성하고 동작을 확인할 수 있다', () => {
        const myCircle = ShapeFactory.createShape('circle', [5]);

        expect(myCircle.draw()).toBe('원 그리기 완료');
        expect(myCircle.getArea()).toBeCloseTo(Math.PI * 25);
    });

    it('팩토리를 통해 정사각형(Square) 객체를 생성하고 동작을 확인할 수 있다', () => {
        const mySquare = ShapeFactory.createShape('square', [4]);

        expect(mySquare.draw()).toBe('정사각형 그리기 완료');
        expect(mySquare.getArea()).toBe(16);
    });

    it('지원하지 않는 도형 타입 요청 시 에러를 던져야 한다', () => {
        expect(() => {
            // @ts-expect-error - 고의로 잘못된 타입 전달
            ShapeFactory.createShape('triangle', [3, 4]);
        }).toThrow('지원하지 않는 도형입니다.');
    });
});
