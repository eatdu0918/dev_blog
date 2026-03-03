import { describe, it, expect } from 'vitest';

/**
 * Polymorphism & Explicit Contract Example
 * 
 * - Contract: An interface defining what should be done.
 * - Polymorphism: Different implementations of the same contract.
 */

// --- Explicit Contract (Interface) ---
interface Shape {
    getArea(): number;
}

// --- Concrete Implementations (Polymorphism) ---
class Circle implements Shape {
    constructor(private radius: number) { }
    getArea() {
        return Math.PI * this.radius ** 2;
    }
}

class Square implements Shape {
    constructor(private side: number) { }
    getArea() {
        return this.side ** 2;
    }
}

// Client code that works with ANY Shape
function calculateTotalArea(shapes: Shape[]): number {
    return shapes.reduce((acc, shape) => acc + shape.getArea(), 0);
}

describe('Polymorphism & Explicit Contract', () => {
    it('should calculate individual areas correctly', () => {
        const circle = new Circle(10);
        const square = new Square(5);

        expect(circle.getArea()).toBeCloseTo(314.159, 3);
        expect(square.getArea()).toBe(25);
    });

    it('should treat different shapes as the same contract', () => {
        const list: Shape[] = [new Circle(10), new Square(5)];
        const total = calculateTotalArea(list);

        expect(total).toBeCloseTo(339.159, 3);
    });
});
