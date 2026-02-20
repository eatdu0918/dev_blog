'use client';

import React from 'react';
import SandpackWrapper from './SandpackWrapper';
import MermaidRenderer from './MermaidRenderer';

interface SandpackRendererProps {
    contentHtml: string;
}

export default function SandpackRenderer({ contentHtml }: SandpackRendererProps) {
    // parser.ts에서 삽입한 placeholder들을 찾습니다.
    const sandpackRegex = /<div class="sandpack-placeholder" data-files="(.*?)" data-mode="(.*?)"><\/div>/g;
    const mermaidRegex = /<div class="mermaid-placeholder" data-code="(.*?)"><\/div>/g;

    const parts: Array<{ type: 'html' | 'sandpack' | 'mermaid', content?: string, files?: Record<string, string>, mode?: 'editor' | 'test', code?: string }> = [];

    let currentHtml = contentHtml;

    // 임시로 모든 placeholder 매칭 정보를 수집
    const matches: Array<{ index: number, length: number, node: any }> = [];

    let match;
    while ((match = sandpackRegex.exec(contentHtml)) !== null) {
        matches.push({
            index: match.index,
            length: match[0].length,
            node: { type: 'sandpack', base64Files: match[1], mode: match[2] }
        });
    }

    mermaidRegex.lastIndex = 0; // Reset
    while ((match = mermaidRegex.exec(contentHtml)) !== null) {
        matches.push({
            index: match.index,
            length: match[0].length,
            node: { type: 'mermaid', base64Code: match[1] }
        });
    }

    // 인덱스 순으로 정렬
    matches.sort((a, b) => a.index - b.index);

    let lastIndex = 0;
    matches.forEach(m => {
        // 이전 HTML 추가
        if (m.index > lastIndex) {
            parts.push({
                type: 'html',
                content: contentHtml.substring(lastIndex, m.index)
            });
        }

        if (m.node.type === 'sandpack') {
            let decodedFiles = {};
            if (typeof window !== 'undefined') {
                decodedFiles = JSON.parse(decodeURIComponent(escape(window.atob(m.node.base64Files))));
            } else {
                decodedFiles = JSON.parse(Buffer.from(m.node.base64Files, 'base64').toString('utf-8'));
            }

            parts.push({
                type: 'sandpack',
                files: decodedFiles as Record<string, string>,
                mode: m.node.mode as 'editor' | 'test'
            });
        } else if (m.node.type === 'mermaid') {
            let decodedCode = '';
            if (typeof window !== 'undefined') {
                decodedCode = decodeURIComponent(escape(window.atob(m.node.base64Code)));
            } else {
                decodedCode = Buffer.from(m.node.base64Code, 'base64').toString('utf-8');
            }
            parts.push({
                type: 'mermaid',
                code: decodedCode
            });
        }

        lastIndex = m.index + m.length;
    });

    // 남은 HTML 추가
    if (lastIndex < contentHtml.length) {
        parts.push({
            type: 'html',
            content: contentHtml.substring(lastIndex)
        });
    }

    if (parts.length === 0) {
        return <div dangerouslySetInnerHTML={{ __html: contentHtml }} />;
    }

    return (
        <>
            {parts.map((part, index) => {
                if (part.type === 'html') {
                    return <div key={index} dangerouslySetInnerHTML={{ __html: part.content! }} />;
                } else if (part.type === 'sandpack') {
                    return (
                        <SandpackWrapper
                            key={index}
                            files={part.files!}
                            mode={part.mode}
                        />
                    );
                } else if (part.type === 'mermaid') {
                    return (
                        <MermaidRenderer key={index} code={part.code!} />
                    );
                }
                return null;
            })}
        </>
    );
}
