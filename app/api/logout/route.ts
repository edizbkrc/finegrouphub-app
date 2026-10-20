import { NextResponse } from "next/server";
import { deleteSession } from "../../lib/session";

export async function GET() {
  try {
    await deleteSession();
    return NextResponse.json({ message: "Session deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Session silinemedi" }, { status: 500 });
  }
}
