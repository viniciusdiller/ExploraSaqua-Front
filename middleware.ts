import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Busca o cookie chamado 'token'
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Se digitar apenas /admin, manda para /admin/login
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // 2. Protege todas as rotas de /admin (exceto a própria página de login)
  if (pathname.startsWith('/admin') && !pathname.includes('/admin/login')) {
    if (!token) {
      // Sem token? Manda para o login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configura para rodar apenas nas rotas de admin
export const config = {
  matcher: ['/admin/:path*'],
};