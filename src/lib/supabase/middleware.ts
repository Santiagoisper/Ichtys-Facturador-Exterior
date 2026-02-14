 import { createServerClient } from "@supabase/ssr";
  import { NextResponse, type NextRequest } from "next/server";

  export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Fail-open para no romper todo el sitio si faltan env vars
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase env vars in middleware");
      return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user && !request.nextUrl.pathname.startsWith("/login")) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }

      if (user && request.nextUrl.pathname.startsWith("/login")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      return supabaseResponse;
    } catch (error) {
      console.error("Middleware auth error:", error);
      return NextResponse.next({ request });
    }
  }
