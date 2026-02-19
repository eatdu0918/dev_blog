import { getAllPostIds, getPost } from '@/lib/posts/service';
import Head from 'next/head';
import Link from 'next/link';
// import Date from '../../../components/date'; // Assuming we might add this later

export async function generateStaticParams() {
    const paths = getAllPostIds();
    return paths;
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
    // Await the params object
    const { slug } = await params;
    const postData = await getPost(slug);

    return (
        <article className="prose prose-zinc dark:prose-invert max-w-none">
            <header className="mb-8 not-prose">
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">{postData.title}</h1>
                <div className="text-zinc-500 text-sm font-mono">{postData.date}</div>
            </header>
            <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />

            <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 not-prose">
                <Link href="/" className="text-blue-500 hover:underline">
                    ← Back to home
                </Link>
            </div>
        </article>
    );
}
