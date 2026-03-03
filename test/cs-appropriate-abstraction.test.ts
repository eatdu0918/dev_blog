import { describe, it, expect } from 'vitest';

/**
 * Appropriate Abstraction Example
 * 
 * - Problem: Simple logic doesn't need 5 interfaces and 10 classes (Over-engineering).
 * - Goal: Find the right level that balances flexibility and simplicity.
 */

// --- Over-engineered (BAD for a simple case) ---
interface ValueSource { getValue(): number; }
interface Adder { add(a: number, b: number): number; }
class SimpleValueSource implements ValueSource { getValue() { return 10; } }
class StandardAdder implements Adder { add(a: number, b: number) { return a + b; } }
class CalculatorAbst {
    constructor(private source: ValueSource, private adder: Adder) { }
    calc() { return this.adder.add(this.source.getValue(), 5); }
}

// --- Appropriate / Simple (GOOD for a simple case) ---
function simpleCalc(baseValue: number) {
    return baseValue + 5;
}

describe('Appropriate Abstraction', () => {
    it('Over-engineered approach works but is hard to maintain for simple needs', () => {
        const calc = new CalculatorAbst(new SimpleValueSource(), new StandardAdder());
        expect(calc.calc()).toBe(15);
    });

    it('Simple approach is enough when requirements are simple', () => {
        expect(simpleCalc(10)).toBe(15);
    });
});
