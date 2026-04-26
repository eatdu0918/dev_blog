import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

export default function Header() {
    return (
        <header className="py-8 mb-8 border-b border-zinc-200 dark:border-zinc-800">
            <div className="container mx-auto px-4 max-w-5xl flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold tracking-tighter hover:underline">
                    My Dev Blog
                </Link>
                <div className="flex items-center gap-6">
                    <nav className="flex items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        <Link href="/qna" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            Interview Q&A
                        </Link>
                    </nav>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
