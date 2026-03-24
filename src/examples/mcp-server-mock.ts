/**
 * Model Context Protocol (MCP) 서버의 요청 처리 과정을 단순화하여 구현한 학습용 시뮬레이션입니다.
 * 모델이 도구(Tool)를 호출할 때 서버가 요청을 수신하고 결과를 반환하는 JSON-RPC 기반 흐름을 이해하기 위해 작성되었습니다.
 */
interface MCPToolRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

interface MCPToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export class MockMCPServer {
  private tools: Record<string, (args: any) => string> = {
    read_note: (args) => `Note content for ${args.id}: "MCP is revolutionary."`,
    get_weather: (args) => `Weather in ${args.city}: Sunny, 22°C`,
  };

  /**
   * 클라이언트로부터 전달받은 JSON-RPC 형태의 도구 호출 요청을 처리합니다.
   */
  async handleRequest(request: MCPToolRequest): Promise<MCPToolResponse> {
    const tool = this.tools[request.params.name];
    if (!tool) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Tool ${request.params.name} not found` }],
      };
    }

    try {
      const result = tool(request.params.arguments);
      return {
        content: [{ type: 'text', text: result }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error executing tool ${request.params.name}: ${error}` }],
      };
    }
  }
}
