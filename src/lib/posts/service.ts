import { getPostSlugs, getPostFileContent } from './repository';
import { parsePostMetadata, parsePostContent } from './parser';
import { PostMetadata, PostContent } from './types';

export function getAllPosts(category?: string): PostMetadata[] {
    const slugs = getPostSlugs();
    const allPostsData = slugs.map((slug) => {
        const fileContents = getPostFileContent(slug.replace(/\.md$/, ''));
        return parsePostMetadata(slug, fileContents);
    });

    // Filter by category if provided
    const filteredPosts = category
        ? allPostsData.filter((post) => post.categories?.includes(category))
        : allPostsData;

    // Sort posts by date
    return filteredPosts.sort((a, b) => {
        if (a.date < b.date) {
            return 1;
        } else {
            return -1;
        }
    });
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
    const slugs = getPostSlugs();
    return slugs.map((fileName) => {
        return {
            params: {
                slug: fileName.replace(/\.md$/, ''),
            },
        };
    });
}

export async function getPost(slug: string): Promise<PostContent> {
    const fileContents = getPostFileContent(slug);
    return await parsePostContent(slug, fileContents);
}
