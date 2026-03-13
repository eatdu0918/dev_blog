import { describe, it, expect } from 'vitest';

class Parent {
  protected className: string = "Parent";

  constructor(public name: string) {}

  greet() {
    return `Hello, I am ${this.name} from ${this.className}`;
  }
}

class Child extends Parent {
  protected className: string = "Child"; // shadowing property

  constructor(parentName: string, name: string) {
    // 1. super() call is mandatory in TS constructors of derived classes
    super(parentName); 
    this.name = name;
  }

  // 2. Overriding and calling super.method()
  greet() {
    const parentGreeting = super.greet();
    return `${parentGreeting}, and also ${this.name} from ${this.className}`;
  }

  getParentClassName() {
    // In TS/JS, super.className (property) would be undefined if accessed from proto.
    // But we can demonstrate that super.greet() uses the Parent's version of logic.
    return super.greet();
  }
}

describe('Java super concepts in TypeScript simulation', () => {
  it('should call parent constructor using super()', () => {
    const child = new Child("Father", "Son");
    // Initially, Parent constructor sets this.name = "Father"
    // Then Child constructor sets this.name = "Son"
    expect(child.name).toBe("Son");
  });

  it('should allow accessing parent method using super', () => {
    const child = new Child("Father", "Son");
    const greeting = child.greet();
    
    // Parent.greet() uses Parent's scope for logic, but 'this' refers to child.
    // However, in JS, properties are on 'this', so Parent.greet() will see Child's className if it's on the instance.
    // But in the class definition above, className is declared on the instance.
    
    // Actually, in JS/TS:
    // Parent.greet returns "Hello, I am Son from Child" (because 'this' is the child instance)
    // Child.greet returns "Hello, I am Son from Child, and also Son from Child"
    
    expect(greeting).toContain("Hello, I am Son from Child");
    expect(greeting).toContain("and also Son from Child");
  });

  it('should demonstrate that super() must be called before this', () => {
    // This is a compile-time check in TS, but we can verify the behavior.
    class AnotherChild extends Parent {
        constructor() {
            // this.name = "fail"; // This would be a syntax error in TS
            super("Safe");
            this.name = "SafeChild";
        }
    }
    const ac = new AnotherChild();
    expect(ac.name).toBe("SafeChild");
  });
});
