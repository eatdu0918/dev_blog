import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { User, Clock } from 'lucide-react';
import type { Comment } from '@/lib/comments';

export default function CommentList({ comments }: { comments: Comment[] }) {
    if (comments.length === 0) {
        return (
            <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-sm">아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요! ✨</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-10">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-zinc-900 dark:text-zinc-100">
                댓글 <span className="text-blue-500">{comments.length}</span>
            </h3>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {comments.map((comment) => (
                    <div key={comment.id} className="py-6 group">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                            {comment.nickname}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded uppercase font-mono">
                                            {comment.ip.split('.').slice(0, 2).join('.')}.*.*
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            {formatDistanceToNow(new Date(comment.createdAt), {
                                                addSuffix: true,
                                                locale: ko,
                                            })}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
