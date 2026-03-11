/**
 * n8n의 핵심 개념인 '노드 기반 워크플로우'를 단순화하여 구현한 예제입니다.
 * 각 노드는 특정 작업을 수행하고, 다음 노드로 데이터를 전달합니다.
 */

export type NodeHandler = (input: any) => Promise<any>;

export interface WorkflowNode {
    id: string;
    name: string;
    handler: NodeHandler;
}

export interface Connection {
    from: string;
    to: string;
}

export class SimpleWorkflowEngine {
    private nodes: Map<string, WorkflowNode> = new Map();
    private connections: Connection[] = [];

    addNode(node: WorkflowNode): void {
        this.nodes.set(node.id, node);
    }

    connect(fromId: string, toId: string): void {
        this.connections.push({ from: fromId, to: toId });
    }

    /**
     * 워크플로우를 실행합니다.
     * 각 노드를 순차적으로 돌며 데이터를 가공합니다.
     */
    async execute(startNodeId: string, initialData: any): Promise<any> {
        let currentNodeId: string | undefined = startNodeId;
        let currentData = initialData;

        while (currentNodeId) {
            const node = this.nodes.get(currentNodeId);
            if (!node) break;

            // 노드 실행
            currentData = await node.handler(currentData);

            // 다음 연결된 노드 찾기 (단선형 워크플로우 가정)
            const nextConnection = this.connections.find(c => c.from === currentNodeId);
            currentNodeId = nextConnection?.to;
        }

        return currentData;
    }
}
