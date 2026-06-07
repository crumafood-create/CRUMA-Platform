import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(
  request: NextRequest
) {
  const protectedRoutes = [
    '/dashboard',
    '/users',
    '/products',
  ];

  const isProtected = protectedRoutes.some(
    route =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
cookies: {
  getAll() {
    return request.cookies.getAll();
  },

  setAll(cookiesToSet: any[]) {
    cookiesToSet.forEach(
      ({ name, value, options }) =>
        response.cookies.set(
          name,
          value,
          options
        )
    );
  },
}
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/products/:path*',
  ],
};
