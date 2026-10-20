/**
 * Client hata logları için HMAC-SHA256 imzası.
 *
 * ⚠️ Bu imza KİMLİK DOĞRULAMASI DEĞİLDİR. Anahtar `NEXT_PUBLIC_LOG_API_SECRET`
 * olduğu için tarayıcı bundle'ına girer; isteyen herkes geçerli imza üretebilir.
 * Sağladığı tek şey, `/api/client-log` ucunun rastgele/otomatik POST'lardan
 * korunması. Log uçlarında rate limit ayrıca uygulanmalıdır.
 */
export async function generateSignature(
  payload: object,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(JSON.stringify(payload))
  );

  // Buffer yerine platform-bağımsız hex dönüşümü (tarayıcıda Buffer yok).
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
