import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  cookies().set("cpx_session", "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
