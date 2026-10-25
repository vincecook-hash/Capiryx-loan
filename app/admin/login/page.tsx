"use client";
import { useState } from "react";
import { api } from "@/lib/api";
export default function AdminLogin() {
  const [f, setF] = useState({ email: "", password: "", totp: "" });
  const [err, setErr] = useState("");
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  return (<div className="w"><div className="card" style={{ maxWidth: 400, margin: "60px auto" }}>
    <h2>Admin sign in</h2>
    <label>Email<input onChange={set("email")} /></label>
    <label>Password<input type="password" onChange={set("password")} /></label>
    <label>Authenticator code<input inputMode="numeric" maxLength={6} onChange={set("totp")} /></label>
    {err && <div className="msg err">{err}</div>}
    <button onClick={async () => { const r = await api("/api/admin/login", "POST", f); r.ok ? (location.href = "/admin") : setErr(r.data.error); }}>Sign in</button>
  </div></div>);
}
