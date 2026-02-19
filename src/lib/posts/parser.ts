import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
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

    const processedContent = await remark()
        .use(remarkGfm)
        .use(html)
        .process(matterResult.content);

    const contentHtml = processedContent.toString();

    return {
        id,
        contentHtml,
        ...(matterResult.data as { date: string; title: string }),
    };
}
