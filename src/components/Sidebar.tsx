import Link from 'next/link';
import { getAllCategories } from '@/lib/posts/service';

export default function Sidebar() {
    const categories = getAllCategories();

    return (
        <aside className="w-full md:w-64 md:mr-8 mb-8 md:mb-0">
            <div className="sticky top-24">
                <h3 className="font-bold text-lg mb-4">Categories</h3>
                <nav className="flex flex-col space-y-2">
                    <Link
                        href="/"
                        className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                        All Posts
                    </Link>
                    {categories.map((category) => (
                        <Link
                            key={category}
                            href={`/?category=${encodeURIComponent(category)}`}
                            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                            {category}
                        </Link>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
