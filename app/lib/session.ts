import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SESSION_COOKIE = "session";
const SESSION_TTL_DAYS = 7;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * D3 (docs/API_ADAPTER.md §4): referans projede bu anahtar koda gömülüydü ve
 * commit edilmişti. Artık env'den okunur ve yoksa uygulama açıkça patlar —
 * sessizce zayıf bir varsayılana düşmek, sızmış bir anahtarla çalışmaktan
 * daha tehlikelidir.
 */
function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SESSION_SECRET tanımlı değil. .env dosyasına ekleyin (bkz. .env.example)."
    );
  }

  return new TextEncoder().encode(secret);
}

export interface ISessionPayload extends JWTPayload {
  data: {
    id: number;
    token: boolean;
  };
  expiresAt: string;
}

export async function encrypt(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(getEncodedKey());
}

export async function decrypt(
  session: string | undefined = ""
): Promise<ISessionPayload | null> {
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as ISessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(data: { id: number; token: boolean }) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await encrypt({ data, expiresAt: expiresAt.toISOString() });

  (await cookies()).set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function updateSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = await decrypt(session);

  if (!session || !payload) return null;

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    // Referansta burası sabit `true` idi; http üzerinden çalışan local/test
    // ortamında cookie hiç yazılmıyordu. Diğer yazma noktasıyla hizalandı.
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  return payload;
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
