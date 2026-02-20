'use client';

import React from 'react';
import SandpackWrapper from './SandpackWrapper';

interface SandpackRendererProps {
    contentHtml: string;
}

export default function SandpackRenderer({ contentHtml }: SandpackRendererProps) {
    // parser.ts에서 삽입한 `<div class="sandpack-placeholder" data-filename="..." data-code="..."></div>` 구조를 찾습니다.
    const sandpackRegex = /<div class="sandpack-placeholder" data-filename="(.*?)" data-code="(.*?)"><\/div>/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = sandpackRegex.exec(contentHtml)) !== null) {
        // Sandpack 블록 이전의 일반 HTML 텍스트를 push
        if (match.index > lastIndex) {
            parts.push({
                type: 'html',
                content: contentHtml.substring(lastIndex, match.index),
            });
        }

        const filename = match[1];
        const base64Code = match[2];

        let decodedCode = '';
        if (typeof window !== 'undefined') {
            // Client Side
            decodedCode = decodeURIComponent(escape(window.atob(base64Code)));
        } else {
            // Server Side (for SSR initial render matching)
            decodedCode = Buffer.from(base64Code, 'base64').toString('utf-8');
        }

        // Sandpack 컴포넌트 추가
        parts.push({
            type: 'sandpack',
            filename: filename || '/App.tsx',
            code: decodedCode,
        });

        lastIndex = sandpackRegex.lastIndex;
    }

    // 마지막 남은 HTML 텍스트 push
    if (lastIndex < contentHtml.length) {
        parts.push({
            type: 'html',
            content: contentHtml.substring(lastIndex),
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
                            files={{ [part.filename!]: part.code! }}
                        />
                    );
                }
                return null; // fallback
            })}
        </>
    );
}
