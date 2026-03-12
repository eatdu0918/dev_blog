/**
 * 컴파일러와 인터프리터의 실행 방식을 시뮬레이션하는 예제 코드입니다.
 */

// 1. 가상의 명령어 인터페이스
interface Instruction {
  type: 'PRINT' | 'ADD';
  value?: string;
  operands?: [number, number];
}

/**
 * 인터프리터 방식 시뮬레이션
 * 소스 코드를 한 줄씩 읽어서 즉시 실행합니다.
 */
export class Interpreter {
  private logs: string[] = [];

  interpret(code: Instruction[]): string[] {
    this.logs = [];
    for (const instruction of code) {
      this.execute(instruction);
    }
    return this.logs;
  }

  private execute(instruction: Instruction) {
    switch (instruction.type) {
      case 'PRINT':
        this.logs.push(`[Interpreter Output]: ${instruction.value}`);
        break;
      case 'ADD':
        const [a, b] = instruction.operands!;
        this.logs.push(`[Interpreter Calc]: ${a} + ${b} = ${a + b}`);
        break;
    }
  }
}

/**
 * 컴파일러 방식 시뮬레이션
 * 전체 소스 코드를 기계어(여기서는 실행 가능한 함수 뭉치)로 번역한 후 한꺼번에 실행합니다.
 */
export class Compiler {
  compile(code: Instruction[]): () => string[] {
    const logs: string[] = [];
    
    // 번역 단계 (번역된 결과물인 전용 함수를 생성)
    const compiledProgram = () => {
      for (const instruction of code) {
        if (instruction.type === 'PRINT') {
          logs.push(`[Binary Exec Output]: ${instruction.value}`);
        } else if (instruction.type === 'ADD') {
          const [a, b] = instruction.operands!;
          logs.push(`[Binary Exec Calc]: ${a} + ${b} = ${a + b}`);
        }
      }
      return logs;
    };

    return compiledProgram;
  }
}
