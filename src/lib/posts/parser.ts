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

    const processedContent = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypePrettyCode, {
            theme: 'one-dark-pro',
            keepBackground: true,
        })
        .use(rehypeStringify)
        .process(matterResult.content);

    const contentHtml = processedContent.toString();

    return {
        id,
        contentHtml,
        ...(matterResult.data as { date: string; title: string }),
    };
}
