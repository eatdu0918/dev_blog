import { SimpleWorkflowEngine, WorkflowNode } from '../src/examples/n8n-workflow-concept';
import { describe, it, expect, vi } from 'vitest';

describe('SimpleWorkflowEngine', () => {
    it('노드들이 순차적으로 실행되며 데이터를 가공해야 한다', async () => {
        const engine = new SimpleWorkflowEngine();

        // 1. 데이터 수신 노드 (Mock)
        const triggerNode: WorkflowNode = {
            id: 'trigger',
            name: 'Webhook Trigger',
            handler: async (input) => ({ ...input, step: 1 })
        };

        // 2. 데이터 가공 노드
        const transformNode: WorkflowNode = {
            id: 'transform',
            name: 'Data Transformer',
            handler: async (input) => ({ ...input, message: input.message.toUpperCase(), step: 2 })
        };

        // 3. 알림 전송 노드
        const notifyNode: WorkflowNode = {
            id: 'notify',
            name: 'Slack Notifier',
            handler: async (input) => ({ ...input, sent: true, step: 3 })
        };

        engine.addNode(triggerNode);
        engine.addNode(transformNode);
        engine.addNode(notifyNode);

        engine.connect('trigger', 'transform');
        engine.connect('transform', 'notify');

        const result = await engine.execute('trigger', { message: 'hello n8n' });

        expect(result).toEqual({
            message: 'HELLO N8N',
            step: 3,
            sent: true
        });
    });

    it('연결된 노드가 없으면 실행이 중단되어야 한다', async () => {
        const engine = new SimpleWorkflowEngine();
        const loneNode: WorkflowNode = {
            id: 'lone',
            name: 'Lone Node',
            handler: async (data) => data
        };

        engine.addNode(loneNode);
        const result = await engine.execute('lone', { test: true });
        expect(result).toEqual({ test: true });
    });
});
