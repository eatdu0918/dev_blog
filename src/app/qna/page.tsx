import { getAllQnaPosts } from '@/lib/posts/service'
import { QnaList } from '@/components/QnaList'

export const metadata = {
  title: 'Interview Q&A Vault',
  description: 'Private knowledge base for interview preparation',
}

export default async function QnaPage() {
  const qnaPosts = await getAllQnaPosts()

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Interview Q&A Vault</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          실무 및 면접을 대비하기 위한 핵심 지식 저장소입니다. 총 {qnaPosts.length}개의 Q&A가 있습니다.
        </p>
      </div>

      <QnaList posts={qnaPosts} />
    </section>
  )
}
