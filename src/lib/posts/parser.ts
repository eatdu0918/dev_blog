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
    const sandpackBlocks: Array<{ filename: string, code: string }> = [];

    // Extract sandpack blocks (supporting \r\n and \n)
    rawContent = rawContent.replace(/::sandpack-start\((.*?)\)\r?\n([\s\S]*?)\r?\n::sandpack-end/g, (match, filename, code) => {
        const index = sandpackBlocks.length;
        sandpackBlocks.push({ filename: filename.trim(), code: code.trim() });
        return `SANDPACK_BLOCK_${index}`;
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
        const encodedCode = Buffer.from(block.code, 'utf-8').toString('base64');
        const placeholder = `<div class="sandpack-placeholder" data-filename="${block.filename}" data-code="${encodedCode}"></div>`;
        // remark parses uppercase magic string in <p> tag
        contentHtml = contentHtml.replace(`<p>SANDPACK_BLOCK_${index}</p>`, placeholder);
    });

    return {
        id,
        contentHtml,
        ...(matterResult.data as { date: string; title: string }),
    };
}
