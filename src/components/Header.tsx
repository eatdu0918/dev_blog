import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

export default function Header() {
    return (
        <header className="py-8 mb-8 border-b border-zinc-200 dark:border-zinc-800">
            <div className="container mx-auto px-4 max-w-2xl flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold tracking-tighter hover:underline">
                    My Dev Blog
                </Link>
                <div className="flex items-center gap-4">
                    <span className="text-zinc-500 text-sm hidden sm:inline-block">Next.js & Markdown</span>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
