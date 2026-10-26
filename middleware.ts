import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Uses Upstash Redis when its keys are set (shared across servers); otherwise a per-instance memory counter.
const mem = new Map<string, { n: number; reset: number }>();
async function limited(key: string, max: number, windowSec: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL, tok = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && tok) {
    try {
      const r = await fetch(`${url}/pipeline`, { method: "POST", headers: { Authorization: `Bearer ${tok}` },
        body: JSON.stringify([["INCR", key], ["EXPIRE", key, windowSec, "NX"]]) });
      const j = await r.json();
      return Number(j[0].result) > max;
    } catch { /* fall back to memory */ }
  }
  const now = Date.now(), h = mem.get(key);
  if (!h || h.reset < now) { mem.set(key, { n: 1, reset: now + windowSec * 1000 }); return false; }
  return ++h.n > max;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";

  if (pathname.startsWith("/api/")) {
    const strict = pathname.startsWith("/api/auth") || pathname === "/api/admin/login";
    if (await limited(`rl:${ip}:${strict ? "auth" : "api"}`, strict ? 20 : 120, strict ? 600 : 60))
      return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
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
