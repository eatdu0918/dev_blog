'use client';

import { useState } from 'react';
import { submitComment } from '@/app/actions/comments';
import { MessageSquare, User, Send } from 'lucide-react';

export default function CommentForm({ slug }: { slug: string }) {
    const [isPending, setIsPending] = useState(false);
    const [nickname, setNickname] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim()) return;

        setIsPending(true);
        setError(null);

        const formData = new FormData();
        formData.append('slug', slug);
        formData.append('nickname', nickname);
        formData.append('content', content);

        const result = await submitComment(formData);
        setIsPending(false);

        if (result.success) {
            setContent('');
            setNickname('');
            setError(null);
        } else if (result.error) {
            setError(result.error);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
            <div className="flex items-center gap-2 mb-4 text-zinc-800 dark:text-zinc-200 font-semibold">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h3>댓글 남기기</h3>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <div className="absolute left-3 top-3 text-zinc-400">
                        <User className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="닉네임 (비워두면 '익명')"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                    />
                </div>

                <textarea
                    placeholder="따뜻한 댓글을 남겨주세요..."
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="w-full p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm resize-none"
                />

                {error && (
                    <div className="p-3 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isPending || !content.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white rounded-lg font-medium transition-all transform active:scale-95 text-sm"
                    >
                        {isPending ? '보내는 중...' : (
                            <>
                                <Send className="w-4 h-4" />
                                등록하기
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
