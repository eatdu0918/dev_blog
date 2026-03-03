import { describe, it, expect, vi } from 'vitest';

/**
 * Interface Segregation Principle (ISP) Example
 * 
 * - Bad: A 'Fat' Interface that forces unused methods on implementations.
 * - Good: Smaller, segregated interfaces.
 */

// --- Bad Case ---
interface MultiFunctionDevice {
    print(): void;
    scan(): void;
    fax(): void;
}

class OldPrinter implements MultiFunctionDevice {
    print() { console.log('Printing...'); }
    scan() { throw new Error('Scan not supported'); } // Forced to implement
    fax() { throw new Error('Fax not supported'); }   // Forced to implement
}

// --- Good Case (ISP Applied) ---
interface Printer {
    print(): void;
}

interface Scanner {
    scan(): void;
}

interface Fax {
    fax(): void;
}

class SimplePrinter implements Printer {
    print() { console.log('Simple Printing...'); }
}

class ProfessionalCopier implements Printer, Scanner {
    print() { console.log('Pro Printing...'); }
    scan() { console.log('Pro Scanning...'); }
}

describe('Interface Segregation Principle', () => {
    it('OldPrinter should throw errors for unsupported methods (Bad ISP)', () => {
        const printer = new OldPrinter();
        expect(() => printer.scan()).toThrow('Scan not supported');
    });

    it('SimplePrinter only implements needed interface (Good ISP)', () => {
        const printer = new SimplePrinter();
        const spy = vi.spyOn(console, 'log');
        printer.print();
        expect(spy).toHaveBeenCalledWith('Simple Printing...');
        spy.mockRestore();
    });

    it('ProfessionalCopier implements multiple interfaces', () => {
        const copier = new ProfessionalCopier();
        const spy = vi.spyOn(console, 'log');
        copier.print();
        copier.scan();
        expect(spy).toHaveBeenCalledWith('Pro Printing...');
        expect(spy).toHaveBeenCalledWith('Pro Scanning...');
        spy.mockRestore();
    });
});
