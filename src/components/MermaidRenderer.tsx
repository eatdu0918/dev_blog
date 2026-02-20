'use client';

import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
    code: string;
}

// Mermaid 초기화 (한 번만 실행)
mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'inherit',
});

export default function MermaidRenderer({ code }: MermaidRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            // 렌더링 시 고유 ID 생성 (Mermaid의 요구사항)
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

            const renderDiagram = async () => {
                try {
                    // 이전에 렌더링된 내용이 있으면 지우기
                    containerRef.current!.innerHTML = '';

                    const { svg } = await mermaid.render(id, code);
                    if (containerRef.current) {
                        containerRef.current.innerHTML = svg;
                    }
                } catch (error) {
                    console.error('Mermaid render error:', error);
                    if (containerRef.current) {
                        containerRef.current.innerText = 'Mermaid 다이어그램을 렌더링하는 중 오류가 발생했습니다.';
                    }
                }
            };

            renderDiagram();
        }
    }, [code]);

    return (
        <div
            ref={containerRef}
            className="mermaid-container flex justify-center my-8 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg overflow-x-auto"
        />
    );
}
