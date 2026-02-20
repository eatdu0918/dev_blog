import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import { PostMetadata, PostContent } from './types';

export function parsePostMetadata(slug: string, fileContents: string): PostMetadata {
    const matterResult = matter(fileContents);
    const id = slug.replace(/\.md$/, '');

    return {
        id,
        ...(matterResult.data as { date: string; title: string }),
    };
}

export async function parsePostContent(slug: string, fileContents: string): Promise<PostContent> {
    const matterResult = matter(fileContents);
    const id = slug.replace(/\.md$/, '');

    let rawContent = matterResult.content;
    const sandpackBlocks: Array<{ files: Record<string, string>, mode: 'editor' | 'test' }> = [];

    // Extract multi-file sandpack blocks
    // Format: :::sandpack(-test)?\n[filename]\ncode\n---\n[filename2]\ncode2\n:::
    rawContent = rawContent.replace(/:::(sandpack(?:-test)?)\r?\n([\s\S]*?)\r?\n:::/g, (match, type, content) => {
        const mode = type === 'sandpack-test' ? 'test' : 'editor';
        const fileSections = content.split(/\r?\n---\r?\n/);
        const files: Record<string, string> = {};

        fileSections.forEach((section: string) => {
            const fileMatch = section.match(/^\[(.*?)\]\r?\n([\s\S]*)$/);
            if (fileMatch) {
                files[fileMatch[1].trim()] = fileMatch[2].trim();
            }
        });

        if (Object.keys(files).length > 0) {
            const index = sandpackBlocks.length;
            sandpackBlocks.push({ files, mode });
            return `SANDPACK_BLOCK_${index}`;
        }
        return match;
    });

    // Support legacy ::sandpack-start for backward compatibility
    rawContent = rawContent.replace(/::sandpack-start\((.*?)\)\r?\n([\s\S]*?)\r?\n::sandpack-end/g, (match, filename, code) => {
        const index = sandpackBlocks.length;
        sandpackBlocks.push({ files: { [filename.trim()]: code.trim() }, mode: 'editor' });
        return `SANDPACK_BLOCK_${index}`;
    });

    const mermaidBlocks: string[] = [];
    // Extract mermaid blocks (```mermaid ... ```)
    rawContent = rawContent.replace(/```mermaid\r?\n([\s\S]*?)\r?\n```/g, (match, code) => {
        const index = mermaidBlocks.length;
        mermaidBlocks.push(code.trim());
        return `MERMAID_BLOCK_${index}`;
    });

    const processedContent = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypePrettyCode, {
            theme: 'one-dark-pro',
            keepBackground: true,
        })
        .use(rehypeStringify)
        .process(rawContent);

    let contentHtml = processedContent.toString();

    // Re-inject sandpack blocks
    sandpackBlocks.forEach((block, index) => {
        const encodedFiles = Buffer.from(JSON.stringify(block.files), 'utf-8').toString('base64');
        const placeholder = `<div class="sandpack-placeholder" data-files="${encodedFiles}" data-mode="${block.mode}"></div>`;
        contentHtml = contentHtml.replace(`<p>SANDPACK_BLOCK_${index}</p>`, placeholder);
    });

    // Re-inject mermaid blocks
    mermaidBlocks.forEach((code, index) => {
        const encodedCode = Buffer.from(code, 'utf-8').toString('base64');
        const placeholder = `<div class="mermaid-placeholder" data-code="${encodedCode}"></div>`;
        contentHtml = contentHtml.replace(`<p>MERMAID_BLOCK_${index}</p>`, placeholder);
    });

    return {
        id,
        contentHtml,
        ...(matterResult.data as { date: string; title: string }),
    };
}
