import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE = "cm_demo";

export async function POST() {
  const store = await cookies();
  store.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(COOKIE);
  return NextResponse.json({ ok: true });
}
