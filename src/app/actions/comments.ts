'use server';

import { addComment } from '@/lib/comments';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function submitComment(formData: FormData) {
    const slug = formData.get('slug') as string;
    const nickname = (formData.get('nickname') as string) || '익명';
    const content = formData.get('content') as string;

    if (!slug || !content) {
        return { error: '필수 항목이 누락되었습니다.' };
    }

    // IP 주소 가져오기
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || '127.0.0.1';

    await addComment({
        slug,
        nickname,
        content,
        ip: Array.isArray(ip) ? ip[0] : ip,
    });

    revalidatePath(`/posts/${slug}`);
    return { success: true };
}
