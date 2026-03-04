import { prisma } from './db';

export interface Comment {
    id: string;
    slug: string;
    nickname: string;
    content: string;
    ip: string;
    createdAt: string;
}

export async function getComments(slug: string): Promise<Comment[]> {
    try {
        const comments = await prisma.comment.findMany({
            where: { slug },
            orderBy: { createdAt: 'desc' },
        });

        return comments.map((c: any) => ({
            ...c,
            ip: c.ip || '127.0.0.1',
            createdAt: c.createdAt.toISOString(),
        }));
    } catch (error) {
        console.error('Error fetching comments from Prisma:', error);
        return [];
    }
}

export async function addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    const newComment = await prisma.comment.create({
        data: {
            slug: comment.slug,
            nickname: comment.nickname,
            content: comment.content,
            ip: comment.ip,
        },
    });

    return {
        ...newComment,
        ip: newComment.ip || '127.0.0.1',
        createdAt: newComment.createdAt.toISOString(),
    };
}
