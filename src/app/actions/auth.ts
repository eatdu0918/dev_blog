'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
  const password = formData.get('password')
  const redirectTo = (formData.get('redirectTo') as string) || '/'
  const correctPassword = process.env.ADMIN_PASSWORD

  if (!correctPassword) {
    console.error('ADMIN_PASSWORD is not set in environment variables')
    return { error: '서버 설정 오류: 관리자 비밀번호가 설정되지 않았습니다.' }
  }

  if (password === correctPassword) {
    const cookieStore = await cookies()
    cookieStore.set('auth_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1주간 유지
    })
    
    // Redirect must be called outside try/catch
  } else {
    return { error: '비밀번호가 일치하지 않습니다.' }
  }
  
  redirect(redirectTo)
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_session')
  redirect('/login')
}
