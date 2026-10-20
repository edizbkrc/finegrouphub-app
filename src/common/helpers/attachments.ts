import { v4 as uuidv4 } from "uuid";
import { getAcceptedFileExtensions, isValidFileExtension } from "@common/helpers/getAcceptedMimeTypes";
import { OpsFileTypeEnum } from "@common/enums/OpsFileTypeEnum";

/** Formlardan bağımsız (react-hook-form kullanmayan) ek dosya seçimi için tek öğe. */
// `type` (interface değil): processFormUploads'taki IUploadItem'ın index imzasıyla uyumlu olması için.
export type IAttachment = {
  id: string;
  fileName: string;
  fileExtension: string;
  base64: string;
};

/** API'nin FileUploadRequest sözleşmesi: base64 gövdesi istek JSON'una girmez. */
export interface IFileUploadRequest {
  id: string;
  fileName: string;
  fileExtension: string;
  order: number;
}

export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

/** Dosya uzantılarını ve boyutunu doğrular; geçersizleri ayırıp geçerleri base64'e çevirir. */
export async function readAttachments(
  files: File[],
  fileType: OpsFileTypeEnum
): Promise<{ accepted: IAttachment[]; invalid: string[]; oversized: string[] }> {
  const invalid: string[] = [];
  const oversized: string[] = [];
  const accepted: IAttachment[] = [];

  for (const file of files) {
    if (!isValidFileExtension(file.name, fileType)) {
      invalid.push(file.name);
      continue;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      oversized.push(file.name);
      continue;
    }
    accepted.push({
      // API boş id'yi olduğu gibi saklıyor; yükleme eşleşmesi için her dosyaya taze GUID verilir.
      id: uuidv4(),
      fileName: file.name,
      fileExtension: file.name.split(".").pop()?.toLowerCase() ?? "",
      base64: await toBase64(file),
    });
  }

  return { accepted, invalid, oversized };
}

/** İstek gövdesindeki `documents` dizisi (base64 olmadan). */
export const toUploadRequests = (attachments: IAttachment[]): IFileUploadRequest[] =>
  attachments.map((item, index) => ({
    id: item.id,
    fileName: item.fileName,
    fileExtension: item.fileExtension,
    order: index,
  }));

/** `<input accept>` için ".jpg,.png" biçiminde liste. */
export const toAcceptAttribute = (fileType: OpsFileTypeEnum): string =>
  getAcceptedFileExtensions(fileType)
    .map((ext) => `.${ext}`)
    .join(",");
