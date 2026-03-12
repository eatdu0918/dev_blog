import { describe, it, expect } from 'vitest';
import { Interpreter, Compiler } from '../src/examples/compiler-interpreter-example';

describe('Compiler vs Interpreter Simulation', () => {
  const sourceCode: any[] = [
    { type: 'PRINT', value: 'Hello World' },
    { type: 'ADD', operands: [10, 20] }
  ];

  it('인터프리터는 코드를 즉시 해석하여 실행 결과를 반환한다', () => {
    const interpreter = new Interpreter();
    const result = interpreter.interpret(sourceCode);
    
    expect(result).toContain('[Interpreter Output]: Hello World');
    expect(result).toContain('[Interpreter Calc]: 10 + 20 = 30');
  });

  it('컴파일러는 코드를 번역한 후, 결과물(함수)을 실행하여 결과를 얻는다', () => {
    const compiler = new Compiler();
    const compiledProgram = compiler.compile(sourceCode); // 번역 단계
    
    const result = compiledProgram(); // 실행 단계
    
    expect(result).toContain('[Binary Exec Output]: Hello World');
    expect(result).toContain('[Binary Exec Calc]: 10 + 20 = 30');
  });
});
