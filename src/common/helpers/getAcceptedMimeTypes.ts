import { OpsFileTypeEnum } from "@common/enums/OpsFileTypeEnum";

export function getAcceptedFileExtensions(fileType: OpsFileTypeEnum): string[] {
  switch (fileType) {
    case OpsFileTypeEnum.Image:
      return ["jpg", "jpeg", "png", "svg"];
    case OpsFileTypeEnum.Video:
      return ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm", "mpeg"];
    case OpsFileTypeEnum.Audio:
      return ["mp3", "wav", "aac", "ogg", "flac", "wma", "m4a"];
    case OpsFileTypeEnum.Document:
      return [
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "txt",
        "csv",
        "jpg",
        "jpeg",
        "png",
      ];
    case OpsFileTypeEnum.Compressed:
      return ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "lz"];
    case OpsFileTypeEnum.Font:
      return ["woff", "woff2", "ttf"];
    case OpsFileTypeEnum.EMail:
      return ["eml", "msg"];
    case OpsFileTypeEnum.ARModel:
      return ["gltf", "glb"];
    case OpsFileTypeEnum.InternetRelated:
      return ["html", "js", "css"];
    default:
      return [];
  }
}

export function isValidFileExtension(
  fileName: string,
  fileType: OpsFileTypeEnum
): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return false;

  const allowedExtensions = getAcceptedFileExtensions(fileType);
  return allowedExtensions.includes(extension);
}

export function getAcceptedMimeTypes(fileType: OpsFileTypeEnum): string[] {
  switch (fileType) {
    case OpsFileTypeEnum.Image:
      return ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
    case OpsFileTypeEnum.Video:
      return [
        "video/mp4",
        "video/x-msvideo", // avi
        "video/quicktime", // mov
        "video/x-ms-wmv", // wmv
        "video/x-flv", // flv
        "video/x-matroska", // mkv
        "video/webm", // webm
        "video/mpeg", // mpeg
      ];
    case OpsFileTypeEnum.Audio:
      return [
        "audio/mpeg", // mp3
        "audio/wav", // wav
        "audio/aac", // aac
        "audio/ogg", // ogg
        "audio/flac", // flac
        "audio/x-ms-wma", // wma
        "audio/mp4", // m4a
      ];
    case OpsFileTypeEnum.Document:
      return [
        "application/pdf", // pdf
        "application/msword", // doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
        "application/vnd.ms-excel", // xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
        "application/vnd.ms-powerpoint", // ppt
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
        "text/plain", // txt
        "text/csv", // csv
        "image/jpeg", // jpg for documents
        "image/png", // png for documents
      ];
    case OpsFileTypeEnum.Compressed:
      return [
        "application/zip", // zip
        "application/x-rar-compressed", // rar
        "application/x-7z-compressed", // 7z
        "application/x-tar", // tar
        "application/gzip", // gz
        "application/x-bzip2", // bz2
        "application/x-xz", // xz
        "application/x-lzip", // lz
      ];
    case OpsFileTypeEnum.Font:
      return ["font/woff", "font/woff2", "application/x-font-ttf"];
    case OpsFileTypeEnum.EMail:
      return ["message/rfc822"];
    case OpsFileTypeEnum.ARModel:
      return ["model/gltf+json", "model/gltf-binary"];
    case OpsFileTypeEnum.InternetRelated:
      return ["text/html", "application/javascript", "text/css"];
    default:
      return [];
  }
}
