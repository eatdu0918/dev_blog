'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface QnaAccordionProps {
  question: string
  answerHtml: string
  tags?: string[]
  level?: string
}

export function QnaAccordion({ question, answerHtml, tags = [], level }: QnaAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden mb-4 bg-white dark:bg-zinc-950 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="text-blue-500 mr-2">Q.</span>
            {question}
          </h3>
          <div className="flex gap-2 items-center mt-1">
            {level && (
              <span className={clsx(
                "px-2 py-0.5 text-xs font-medium rounded-md",
                level === 'senior' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                level === 'mid' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              )}>
                {level.toUpperCase()}
              </span>
            )}
            {tags.length > 0 && tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <ChevronDown
          className={clsx(
            "w-5 h-5 text-zinc-500 transition-transform duration-200 flex-shrink-0 ml-4",
            isOpen && "transform rotate-180"
          )}
        />
      </button>
      
      {isOpen && (
        <div 
          className="p-5 prose prose-zinc dark:prose-invert max-w-none border-t border-zinc-200 dark:border-zinc-800"
          dangerouslySetInnerHTML={{ __html: answerHtml }}
        />
      )}
    </div>
  )
}
