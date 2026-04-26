import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /qna 경로로 시작하는 요청에 대해서만 인증을 체크합니다.
  if (pathname.startsWith('/qna')) {
    const authCookie = request.cookies.get('auth_session')

    if (!authCookie || authCookie.value !== 'authenticated') {
      // 비밀번호가 없으면 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname) // 로그인 성공 후 돌아올 경로 저장
      return NextResponse.redirect(loginUrl)
    }
  }

  // 그 외의 모든 경로(홈, 일반 포스트, 로그인 페이지 등)는 자유롭게 접근 허용
  return NextResponse.next()
}

export const config = {
  matcher: ['/qna/:path*'], // 오직 /qna 및 하위 경로에 대해서만 이 미들웨어를 실행
}
