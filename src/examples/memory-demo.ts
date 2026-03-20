export class MemoryNode {
    public partner: MemoryNode | null = null;
    constructor(public name: string) {}
}

/**
 * 순환 참조 상황에서 도달 가능성이 어떻게 변하는지 확인해 보기 위해 시뮬레이션해 봅니다.
 * A <-> B 가 서로를 참조하고 있는 상태에서 외부(Root)의 연결을 끊는 상황입니다.
 */
export function simulateCircularReference() {
    let nodeA: MemoryNode | null = new MemoryNode("Node A");
    let nodeB: MemoryNode | null = new MemoryNode("Node B");

    // 서로를 참조하게 하여 순환 참조 고리를 만듭니다.
    nodeA.partner = nodeB;
    nodeB.partner = nodeA;

    // 만약 예전의 참조 카운팅 방식이었다면, 아래처럼 외부 참조를 끊어도
    // 서로를 쥐고 있는 카운트가 남아서 메모리에서 해제되지 않았을 것입니다.
    nodeA = null;
    nodeB = null;

    // 하지만 지금의 Mark-and-Sweep 방식에서는 '뿌리(Root)'로부터의 경로가 끊겼음을 감지하고 
    // 다음 GC 사이클에 수거 대상으로 분류됨을 알게 되었습니다.
    return "Disconnected from Root";
}
