import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rotas públicas que não exigem autenticação
const publicRoutes = ['/login'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Verifica se a rota é pública
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  // Se for uma API, não aplicar o middleware
  if (path.includes('/api/')) {
    return NextResponse.next();
  }
  
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Se o usuário estiver autenticado e estiver tentando acessar o login, redireciona para a home
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Se não estiver autenticado e não for uma rota pública, redireciona para o login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)'],
}; 