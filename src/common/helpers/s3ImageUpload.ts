import imageCompression from "browser-image-compression";

export interface IImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

/**
 * ⚠️ Referansta bu fonksiyon dosya boyutuna göre 4 ayrı `if` dalına
 * ayrılıyordu ama HEPSİ birebir aynı nesneyi döndürüyordu
 * (`{ maxSizeMB: originalSizeMB, useWebWorker: true, quality: 0.8 }`) —
 * ölü dallanma. `maxSizeMB`'nin mevcut boyutun kendisi olması, sıkıştırmanın
 * fiilen yalnızca `quality: 0.8` üzerinden çalıştığı, boyut tavanının
 * bağlayıcı olmadığı anlamına gelir; bu davranış korunmuştur.
 */
function getCompressionOptions(originalSizeMB: number): IImageCompressionOptions {
  return { maxSizeMB: originalSizeMB, useWebWorker: true, quality: 0.8 };
}

export async function compressImage(file: File): Promise<File> {
  try {
    const fileSizeMB = file.size / 1024 / 1024;
    return await imageCompression(file, getCompressionOptions(fileSizeMB));
  } catch {
    return file;
  }
}

/**
 * İki fazlı yükleme akışının 2. adımı: base64/blob URI'yi presigned S3 URL'ine
 * PUT eder (docs/API_ADAPTER.md §3.8).
 */
export async function s3ImageUpload(signedUrl: string, base64Uri: string) {
  const response = await fetch(base64Uri);
  let body: Blob = await response.blob();

  if (body.type.startsWith("image/")) {
    const file = new File([body], "image", { type: body.type });
    body = await compressImage(file);
  }

  return fetch(signedUrl, {
    method: "PUT",
    body,
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
