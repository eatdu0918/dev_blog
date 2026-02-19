import fs from 'fs';
import path from 'path';

const postsDirectory = path.join(process.cwd(), 'src/posts');

export function getPostSlugs(): string[] {
    if (!fs.existsSync(postsDirectory)) {
        return [];
    }
    return fs.readdirSync(postsDirectory);
}

export function getPostFileContent(slug: string): string {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Post not found: ${slug}`);
    }
    return fs.readFileSync(fullPath, 'utf8');
}
