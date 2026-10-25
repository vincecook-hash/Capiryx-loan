import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// In-memory limiter: fine for one instance. For several instances or serverless, swap for Upstash Redis.
const hits = new Map<string, { n: number; reset: number }>();
function limited(key: string, max: number, windowMs: number) {
  const now = Date.now(), h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return false; }
  return ++h.n > max;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";

  if (pathname.startsWith("/api/")) {
    const strict = pathname.startsWith("/api/auth") || pathname === "/api/admin/login";
    if (limited(`${ip}:${strict ? "auth" : "api"}`, strict ? 20 : 120, strict ? 600_000 : 60_000))
      return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
    // Origin check for state-changing calls (the KYC webhook is server to server)
    if (req.method !== "GET" && pathname !== "/api/kyc/webhook") {
      const origin = req.headers.get("origin");
      if (!origin || new URL(origin).host !== req.nextUrl.host)
        return NextResponse.json({ error: "Bad origin" }, { status: 403 });
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const t = req.cookies.get("cpx_session")?.value;
    try {
      const { payload } = await jwtVerify(t!, new TextEncoder().encode(process.env.SESSION_SECRET!));
      if (payload.role !== "ADMIN") throw new Error();
    } catch { return NextResponse.redirect(new URL("/admin/login", req.url)); }
  }
  return NextResponse.next();
}
export const config = { matcher: ["/api/:path*", "/admin/:path*"] };
