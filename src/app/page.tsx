import Link from 'next/link';
import { getSortedPostsData } from '@/lib/posts';

export default function Home() {
  const allPostsData = getSortedPostsData();

  return (
    <section>
      <h2 className="text-3xl font-bold mb-8">Recent Posts</h2>
      <div className="space-y-6">
        {allPostsData.map(({ id, date, title }) => (
          <article key={id} className="block group">
            <Link href={`/posts/${id}`}>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-xl font-semibold mb-1 group-hover:underline decoration-zinc-400 underline-offset-4">
                  {title}
                </h3>
                <time className="text-zinc-500 text-sm font-mono whitespace-nowrap">
                  {date}
                </time>
              </div>
            </Link>
          </article>
        ))}
        {allPostsData.length === 0 && (
          <p className="text-zinc-500">아직 작성된 글이 없습니다.</p>
        )}
      </div>
    </section>
  );
}
