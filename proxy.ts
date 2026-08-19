import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Paths that do not require authentication
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/auth");
  const isPublicApi = pathname === "/api/health" || pathname.startsWith("/api/webhooks");

  if (!user && !isAuthRoute && !isPublicApi && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/student"; // They will be redirected by layout if role differs, or we can check role here.
    // For simplicity, we send them to their dashboard root, let's just send to /
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Basic Role-Based Path Protection
  if (user && (pathname.startsWith("/admin") || pathname.startsWith("/alumni") || pathname.startsWith("/student"))) {
    // Attempt to determine role
    let role = user.user_metadata?.role;
    
    // If not in metadata, fetch from DB
    if (!role) {
      const { data: admin } = await supabase.from('admin_profiles').select('id').eq('id', user.id).maybeSingle();
      if (admin) role = 'admin';
      else {
        const { data: alumni } = await supabase.from('alumni_profiles').select('id').eq('id', user.id).maybeSingle();
        if (alumni) role = 'alumni';
        else role = 'student'; // Default fallback
      }
    }

    if (pathname.startsWith("/admin") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = `/${role}`;
      return NextResponse.redirect(url);
    }
    
    if (pathname.startsWith("/alumni") && role !== "alumni" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = `/${role}`;
      return NextResponse.redirect(url);
    }
    
    if (pathname.startsWith("/student") && role !== "student" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = `/${role}`;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, fonts, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
