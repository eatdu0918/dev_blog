'use client';

import React from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';

interface SandpackWrapperProps {
    files: Record<string, string>;
    template?: 'react' | 'react-ts' | 'vanilla';
}

export default function SandpackWrapper({ files, template = 'react-ts' }: SandpackWrapperProps) {
    return (
        <div className="my-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <Sandpack
                template={template}
                files={files}
                theme="dark"
                options={{
                    showNavigator: true,
                    showLineNumbers: true,
                    editorHeight: 400,
                }}
                customSetup={{
                    dependencies: {
                        "@testing-library/react": "^14.0.0",
                        "@testing-library/jest-dom": "^5.16.5"
                    }
                }}
            />
        </div>
    );
}
