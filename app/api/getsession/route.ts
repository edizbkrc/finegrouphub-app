import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "../../lib/session";

export async function GET() {
  const session = (await cookies()).get("session")?.value;
  const payload = await decrypt(session);

  if (!payload) {
    return NextResponse.json({ error: "Session bulunamadı" }, { status: 401 });
  }

  return NextResponse.json({ data: payload });
}
