import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Başarı mesajlarını toast'a basma (hata mesajları yine basılır). */
    withoutToast?: boolean;
    /** Hata mesajlarını da toast'a basma. */
    withoutErrorToast?: boolean;
    /** `M-Metadata: true` gönder — yanıtta `metadatas[]` istenir. */
    isMetaData?: boolean;
  }
}
