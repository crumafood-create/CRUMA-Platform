import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. LÓGICA DE SESIÓN: Inicializar el cliente de Supabase en el Edge
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. LÓGICA DE PROTECCIÓN: Verificar sesión activa
  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rutas de Dashboard y Admin
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isB2BRoute = request.nextUrl.pathname.startsWith('/b2b')

  if ((isDashboardRoute || isAdminRoute || isB2BRoute) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. LÓGICA ANTI-BLOQUEO: Validación de Perfil (Hallazgo Crítico)
  if (user && (isDashboardRoute || isB2BRoute)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single()

    // Si el usuario existe pero el perfil no (o no ha terminado el registro)
    if (!profile || !profile.onboarding_completed) {
      // Evitar bucle infinito si ya está en la página de completar-perfil
      if (!request.nextUrl.pathname.startsWith('/completar-perfil')) {
        return NextResponse.redirect(new URL('/completar-perfil', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
