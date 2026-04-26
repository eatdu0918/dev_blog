'use client'

import { useActionState, Suspense } from 'react'
import { login } from '@/app/actions/auth'
import { useSearchParams } from 'next/navigation'

const initialState = { error: '' }

function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState)
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/'

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Private Knowledge Base
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          접근하려면 비밀번호를 입력하세요.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirectTo" value={from} />
        <div className="space-y-2">
          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            required
            className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 transition-colors"
          />
        </div>

        {state?.error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-3 rounded-lg">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? '확인 중...' : '잠금 해제'}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 animate-pulse">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mx-auto mb-4" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mx-auto mb-8" />
          <div className="h-12 bg-zinc-100 dark:bg-zinc-950 rounded-xl mb-4" />
          <div className="h-12 bg-zinc-900 dark:bg-zinc-100 rounded-xl" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
