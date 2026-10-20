import { NextResponse } from "next/server";
import { createSession } from "../../lib/session";

/**
 * Login başarılı olduktan sonra httpOnly session cookie'sini oluşturur.
 *
 * Cookie yalnızca `{ id, token: true }` taşır — access token'ın kendisi ASLA
 * cookie'ye yazılmaz. Middleware sadece "oturum var mı" sorusunu sorar;
 * yetkilendirme API tarafında Bearer token ile yapılır.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (typeof body?.id !== "number") {
      return NextResponse.json(
        { error: "Geçersiz oturum verisi" },
        { status: 400 }
      );
    }

    await createSession({ id: body.id, token: true });

    return NextResponse.json({ message: "Session created" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Session oluşturulamadı" },
      { status: 500 }
    );
  }
}
