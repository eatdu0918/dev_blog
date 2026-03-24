import { describe, it, expect } from 'vitest';
import { MockMCPServer } from '../src/examples/mcp-server-mock';

describe('Model Context Protocol (MCP) 서버 도구 호출 시뮬레이션', () => {
  const server = new MockMCPServer();

  it('등록된 도구(read_note)를 정상적으로 호출하고 결과를 반환해야 함', async () => {
    const request = {
      method: 'tools/call' as const,
      params: { name: 'read_note', arguments: { id: '123' } },
    };
    const response = await server.handleRequest(request);

    expect(response.isError).toBeUndefined();
    expect(response.content[0].text).toContain('MCP is revolutionary');
  });

  it('등록된 도구(get_weather)를 정상적으로 호출하고 결과를 반환해야 함', async () => {
    const request = {
      method: 'tools/call' as const,
      params: { name: 'get_weather', arguments: { city: 'Seoul' } },
    };
    const response = await server.handleRequest(request);

    expect(response.isError).toBeUndefined();
    expect(response.content[0].text).toContain('Seoul');
    expect(response.content[0].text).toContain('22°C');
  });

  it('존재하지 않는 도구 호출 시 에러 응답을 반환해야 함', async () => {
    const request = {
      method: 'tools/call' as const,
      params: { name: 'unknown_tool', arguments: {} },
    };
    const response = await server.handleRequest(request);

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('not found');
  });
});
