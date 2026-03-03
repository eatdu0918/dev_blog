import { describe, it, expect, vi } from 'vitest';

/**
 * Overloading (Static Polymorphism) vs Single Method (Dynamic Polymorphism)
 * 
 * - Overloading: One class has multiple methods with same name but different signatures.
 * - Single Method (Polymorphism/Overriding): Different classes implement same method name.
 */

// --- Overloading Concept (TS style) ---
class Logger {
    log(message: string): void;
    log(error: Error): void;
    log(data: object): void;
    log(arg: any): void {
        if (typeof arg === 'string') {
            console.log(`MSG: ${arg}`);
        } else if (arg instanceof Error) {
            console.log(`ERR: ${arg.message}`);
        } else {
            console.log(`DATA: ${JSON.stringify(arg)}`);
        }
    }
}

// --- Single Method (Dynamic Polymorphism) ---
interface Loggable {
    format(): string;
}

class StringLog implements Loggable {
    constructor(private msg: string) { }
    format() { return `MSG: ${this.msg}`; }
}

class ErrorLog implements Loggable {
    constructor(private err: Error) { }
    format() { return `ERR: ${this.err.message}`; }
}

class UniversalLogger {
    log(item: Loggable) {
        console.log(item.format());
    }
}

describe('Overloading vs Single Method', () => {
    it('overloaded logger handles different types', () => {
        const logger = new Logger();
        const spy = vi.spyOn(console, 'log');

        logger.log('Hello');
        expect(spy).toHaveBeenCalledWith('MSG: Hello');

        logger.log(new Error('Fail'));
        expect(spy).toHaveBeenCalledWith('ERR: Fail');

        spy.mockRestore();
    });

    it('polymorphic logger delegates formatting to objects', () => {
        const logger = new UniversalLogger();
        const spy = vi.spyOn(console, 'log');

        logger.log(new StringLog('Hi'));
        expect(spy).toHaveBeenCalledWith('MSG: Hi');

        logger.log(new ErrorLog(new Error('Oops')));
        expect(spy).toHaveBeenCalledWith('ERR: Oops');

        spy.mockRestore();
    });
});
