import { getPostSlugs, getPostFileContent } from './repository';
import { parsePostMetadata, parsePostContent } from './parser';
import { PostMetadata, PostContent } from './types';

export function getAllPosts(category?: string, includeQna: boolean = false): PostMetadata[] {
    const slugs = getPostSlugs();
    const allPostsData = slugs.map((slug) => {
        const fileContents = getPostFileContent(slug.replace(/\.md$/, ''));
        return parsePostMetadata(slug, fileContents);
    });

    // Filter by published status
    let filteredPosts = process.env.NODE_ENV === 'development'
        ? allPostsData
        : allPostsData.filter((post) => post.published !== false);

    // Filter by category if provided
    if (category) {
        filteredPosts = filteredPosts.filter((post) => post.categories?.includes(category));
    }

    // By default, exclude 'qna' type posts from the main feed
    if (!includeQna) {
        filteredPosts = filteredPosts.filter((post) => post.type !== 'qna');
    }

    // Sort posts by date
    return filteredPosts.sort((a, b) => {
        if (a.date < b.date) {
            return 1;
        } else {
            return -1;
        }
    });
}

export async function getAllQnaPosts(): Promise<PostContent[]> {
    const slugs = getPostSlugs();
    
    const allPostsData = await Promise.all(slugs.map(async (slug) => {
        const fileContents = getPostFileContent(slug.replace(/\.md$/, ''));
        const metadata = parsePostMetadata(slug, fileContents);
        if (metadata.type === 'qna' && (process.env.NODE_ENV === 'development' || metadata.published !== false)) {
             return await parsePostContent(slug, fileContents);
        }
        return null;
    }));

    const qnaPosts = allPostsData.filter((post): post is PostContent => post !== null);
    
    return qnaPosts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllCategories(): string[] {
    const posts = getAllPosts();
    const categories = new Set<string>();
    posts.forEach((post) => {
        post.categories?.forEach((category) => categories.add(category));
    });
    return Array.from(categories).sort();
}

export function getAllPostIds() {
    const posts = getAllPosts(undefined, true);
    return posts.map((post) => {
        return {
            params: {
                slug: post.id,
            },
        };
    });
}

export async function getPost(slug: string): Promise<PostContent> {
    const fileContents = getPostFileContent(slug);
    return await parsePostContent(slug, fileContents);
}
