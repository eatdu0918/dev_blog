'use client';

import React from 'react';
import { Sandpack, SandpackTests, SandpackProvider, SandpackLayout, SandpackCodeEditor } from '@codesandbox/sandpack-react';

interface SandpackWrapperProps {
    files: Record<string, string>;
    template?: 'react' | 'react-ts' | 'vanilla' | 'node';
    mode?: 'editor' | 'test';
}

export default function SandpackWrapper({ files, template = 'react-ts', mode = 'editor' }: SandpackWrapperProps) {
    return (
        <div className="my-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
            {mode === 'test' ? (
                <SandpackProvider
                    template={template}
                    files={files}
                    theme="dark"
                >
                    <SandpackLayout>
                        <SandpackCodeEditor showLineNumbers showTabs />
                        <SandpackTests />
                    </SandpackLayout>
                </SandpackProvider>
            ) : (
                <Sandpack
                    template={template}
                    files={files}
                    theme="dark"
                    options={{
                        showNavigator: true,
                        showLineNumbers: true,
                        editorHeight: 400,
                    }}
                />
            )}
        </div>
    );
}
