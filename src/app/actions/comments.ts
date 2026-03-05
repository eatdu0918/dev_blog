'use server';

import { addComment } from '@/lib/comments';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function submitComment(formData: FormData) {
    try {
        const slug = formData.get('slug') as string;
        const nickname = (formData.get('nickname') as string) || '익명';
        const content = formData.get('content') as string;

        if (!slug || !content) {
            return { error: '필수 항목이 누락되었습니다.' };
        }

        // IP 주소 가져오기 (Vercel 환경 최적화: x-real-ip 우선)
        const headerList = await headers();
        const realIp = headerList.get('x-real-ip');
        const forwardedFor = headerList.get('x-forwarded-for');

        let ip = '127.0.0.1';
        if (realIp) {
            ip = realIp;
        } else if (forwardedFor) {
            ip = forwardedFor.split(',')[0].trim();
        }

        console.log(`[Comment Debug] Slug: ${slug}, IP: ${ip}, RealIP: ${realIp}, ForwardedFor: ${forwardedFor}`);

        await addComment({
            slug,
            nickname,
            content,
            ip,
        });

        revalidatePath(`/posts/${slug}`);
        return { success: true };
    } catch (error: any) {
        console.error('Comment submission action failed:', error);
        return { error: error.message || '댓글 제출 중 예기치 못한 오류가 발생했습니다.' };
    }
}
