---
published: true
title: "AI와 데이터의 경계를 허무는 표준: MCP(Model Context Protocol)의 등장과 동작 원리"
description: "고립된 거대 언어 모델(LLM)을 외부 데이터와 동적으로 연결하는 새로운 오픈 표준인 Model Context Protocol(MCP)의 핵심 아키텍처와 활용 가능성을 탐구합니다."
date: "2026-03-24"
tags: ["AI", "Architecture", "MCP", "Anthropic"]
---

# AI와 데이터의 경계를 허무는 표준: MCP(Model Context Protocol)의 등장과 동작 원리

![MCP 아키텍처 도식](/public/images/mcp-architecture-diagram.png)

그동안 대규모 언어 모델(LLM)을 사용하면서 가장 아쉬웠던 점은 모델이 학습된 과거 데이터에 갇혀 있거나, 실시간 데이터에 접근하기 위해 매번 복잡한 커스텀 통합(Integration) 코드를 작성해야 한다는 점이었습니다. 서비스마다 API 규격이 다르고, 데이터 구조가 제각각인 상황에서 LLM이 세상을 더 넓게 보기란 쉬운 일이 아니었습니다.

이러한 문제를 해결하기 위해 Anthropic에서 제안한 **MCP(Model Context Protocol)**는 AI 모델과 외부 데이터 소스 간의 통신을 표준화하는 강력한 약속으로 등장했습니다. 이번 학습에서는 MCP가 왜 필요한지, 그리고 내부적으로 어떤 구조로 동작하는지 그 핵심을 정리해 보았습니다.

---

## 1. MCP가 해결하려는 문제: N x M의 굴레

기존에는 새로운 AI 도구와 새로운 데이터 소스를 연결할 때마다 일대일(Point-to-Point)로 통합 작업을 해야 했습니다. 만약 5개의 AI 앱이 5개의 데이터 소스(GitHub, Google Drive 등)에 접근하려면 총 25개의 서로 다른 통합 코드가 필요했습니다.

MCP는 이를 **'AI 앱(Host) - MCP Client - MCP Server - 데이터 소스'**라는 표준화된 계층으로 해결합니다. 데이터 소스는 MCP Server 규격만 맞추면 되고, AI 앱은 MCP Client만 구현하면 세상의 모든 MCP Server와 소통할 수 있게 됩니다.

---

## 2. MCP의 핵심 아키텍처와 구성 요소

MCP는 전형적인 클라이언트-서버 모델을 따르며, JSON-RPC 2.0 프로토콜을 기반으로 소통합니다.

- **MCP Host**: 사용자가 상호작용하는 실제 앱입니다. (예: Claude Desktop, IDE 플러그인 등)
- **MCP Client**: Host 내부에 존재하며 LLM의 요청을 MCP Server가 이해할 수 있는 규격으로 변환하여 전달합니다.
- **MCP Server**: 실제 데이터 소스나 도구(Tool)를 직접 제어하는 독립적인 프로그램입니다. 로컬 파일 시스템, 데이터베이스, 외부 API 등이 서버가 될 수 있습니다.

특히 인상 깊은 것은 보안을 위해 각 클라이언트와 서버가 **1:1 전용 연결(Sandboxing)**을 유지하며 통신한다는 점이었습니다.

---

## 3. 서버가 제공하는 세 가지 핵심 프리미티브

MCP 서버는 크게 세 가지 형태의 자원을 노출(Expose)할 수 있습니다.

1. **Resources (자원)**: 읽기 전용 데이터입니다. 파일 내용, DB 레코드, API 응답 등 LLM에게 '맥락(Context)'을 제공하는 용도입니다.
2. **Tools (도구)**: 모델이 호출할 수 있는 '함수'입니다. 로컬 파일 수정하기, 이메일 보내기 등 모델이 세상에 물리적인 변화를 일으킬 수 있게 합니다.
3. **Prompts (프롬프트)**: 자주 사용되는 프롬프트 템플릿입니다. 특정 작업을 위한 시스템 프롬프트를 서버가 미리 정의해 두고 모델이 이를 가져다 쓸 수 있습니다.

---

## 4. 내부 동작의 이해: JSON-RPC 기반의 대화

MCP는 `stdio`나 `SSE(Server-Sent Events)`를 통해 JSON-RPC 메시지를 주고받습니다. 예를 들어, 모델이 로컬 파일을 읽고 싶어 할 때의 흐름을 상상해 보았습니다.

1. **Handshake**: 초기 연결 시 클라이언트와 서버는 서로의 기능(Capabilities)을 확인합니다.
2. **List Resources**: 서버는 자신이 가진 자원의 URI 목록을 알려줍니다.
3. **Read Resource**: 클라이언트가 특정 URI의 자원을 요청하면, 서버는 그 내용을 텍스트나 바이너리 형태로 반환합니다.

---

## 5. 실전 구현 시나리오 (Mock)

MCP 서버에서 도구(Tool)를 호출하는 과정을 간단한 TypeScript 코드로 모사해 보았습니다.

### MCP 도구 호출 핸들러 시뮬레이션

```typescript
// src/examples/mcp-server-mock.ts
interface MCPToolRequest {
    method: "tools/call";
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
        "read_note": (args) => `Note content for ${args.id}: "MCP is revolutionary."`,
        "get_weather": (args) => `Weather in ${args.city}: Sunny, 22°C`
    };

    async handleRequest(request: MCPToolRequest): Promise<MCPToolResponse> {
        const tool = this.tools[request.params.name];
        if (!tool) {
            return {
                isError: true,
                content: [{ type: "text", text: `Tool ${request.params.name} not found` }]
            };
        }

        const result = tool(request.params.arguments);
        return {
            content: [{ type: "text", text: result }]
        };
    }
}
```

### 도구 처리 로직 검증 테스트

```typescript
// test/mcp-server.test.ts
import { describe, it, expect } from 'vitest';
import { MockMCPServer } from '../src/examples/mcp-server-mock';

describe('MCP 서버 도구 호출 시뮬레이션', () => {
    const server = new MockMCPServer();

    it('등록된 도구를 호출하면 결과를 반환해야 함', async () => {
        const request = {
            method: "tools/call" as const,
            params: { name: "read_note", arguments: { id: "123" } }
        };
        const response = await server.handleRequest(request);
        expect(response.content[0].text).toContain("MCP is revolutionary");
    });

    it('미등록 도구 호출 시 에러를 반환해야 함', async () => {
        const request = {
            method: "tools/call" as const,
            params: { name: "unknown", arguments: {} }
        };
        const response = await server.handleRequest(request);
        expect(response.isError).toBe(true);
    });
});
```

---

## 💡 마치며: AI 에이전트 시대의 새로운 인프라

MCP를 학습하며 느낀 점은, 이제 AI는 단순히 '똑똑한 챗봇'을 넘어 '행동하는 에이전트'로 진화하고 있다는 사실입니다. 그 진화의 핵심에는 파편화된 데이터를 하나로 묶어주는 **'연결의 표준'**이 필수적이었고, MCP가 그 역할을 훌륭히 수행할 수 있겠다는 확신이 들었습니다.

물론 대중적인 서버 생태계가 구축되기까지는 시간이 걸리겠지만, 이제 누구나 자신만의 데이터를 MCP 서버로 만들어 LLM에게 날개를 달아줄 수 있다는 점이 매우 고무적이었습니다. 다음 학습에서는 실제로 오픈소스 MCP 서버를 로컬에 구축하여 Claude Desktop과 연결해 보는 실습을 진행해 보려 합니다.
