'use client'

import { useState } from 'react'
import { QnaAccordion } from '@/components/QnaAccordion'
import type { PostContent } from '@/lib/posts/types'
import { Search } from 'lucide-react'

export function QnaList({ posts }: { posts: PostContent[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = posts.filter(post => {
    const query = searchQuery.toLowerCase()
    return (
      post.title.toLowerCase().includes(query) ||
      (post.categories && post.categories.some(tag => tag.toLowerCase().includes(query)))
    )
  })

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl leading-5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-colors"
          placeholder="면접 질문이나 태그를 검색하세요... (예: event loop, msa, react)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <QnaAccordion
            key={post.id}
            question={post.title}
            answerHtml={post.contentHtml}
            tags={post.categories}
            level={post.level as string}
          />
        ))}

        {filteredPosts.length === 0 && searchQuery && (
          <div className="p-8 text-center text-zinc-500">
            "{searchQuery}"에 대한 검색 결과가 없습니다.
          </div>
        )}

        {posts.length === 0 && !searchQuery && (
          <div className="p-8 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            아직 등록된 면접/실무 Q&A가 없습니다. 
            <br/>마크다운 Frontmatter에 <code>type: 'qna'</code>를 추가하여 첫 Q&A를 작성해보세요.
          </div>
        )}
      </div>
    </div>
  )
}
