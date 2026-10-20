import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { logger } from "../../../instrumentation.node";

/** Zamanlama saldırılarına kapalı imza karşılaştırması. */
function signaturesMatch(expected: string, received: unknown): boolean {
  if (typeof received !== "string") return false;

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  // timingSafeEqual farklı uzunluklarda fırlatır — önce uzunluk kontrolü.
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(req: NextRequest) {
  const secret = process.env.LOG_API_SECRET;

  if (!secret) {
    return NextResponse.json(
      { success: false, message: "Log ucu yapılandırılmamış" },
      { status: 503 }
    );
  }

  let payload: any;
  let signature: unknown;

  try {
    ({ payload, signature } = await req.json());
  } catch {
    return NextResponse.json(
      { success: false, message: "Geçersiz gövde" },
      { status: 400 }
    );
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  // ⚠️ Referansta düz `!==` kullanılıyordu (zamanlama sızıntısı).
  if (!signaturesMatch(expected, signature)) {
    return NextResponse.json(
      { success: false, message: "Invalid signature" },
      { status: 403 }
    );
  }

  logger.emit({
    severityNumber: SeverityNumber.ERROR,
    severityText: "ERROR",
    body: payload?.message ?? "Client error",
    attributes: payload,
  });

  return NextResponse.json({ success: true });
}
