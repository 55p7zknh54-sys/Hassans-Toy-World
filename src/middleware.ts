import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * 1. Storefront: `/shop` → `/en/shop` (or `/ar/shop` if the visitor chose Arabic before).
 * 2. Admin: keeps the Supabase login session fresh and sends signed-out visitors to the login page.
 *    (Every admin page and action re-checks admin rights on the server as well.)
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.next();

    let res = NextResponse.next({ request: req });
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && pathname !== '/admin/login') {
      const login = req.nextUrl.clone();
      login.pathname = '/admin/login';
      login.search = '';
      return NextResponse.redirect(login);
    }
    return res;
  }

  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) return NextResponse.next();

  const first = pathname.split('/')[1];
  if (first === 'en' || first === 'ar') return NextResponse.next();

  const lang = req.cookies.get('hw_lang')?.value === 'ar' ? 'ar' : 'en';
  const target = req.nextUrl.clone();
  target.pathname = `/${lang}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(target);
}

export const config = {
  // Skip static files (anything with a dot: images, sitemap.xml, robots.txt, favicon…).
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
