/**
 * API adaptör katmanı.
 *
 * K2 kararı = seçenek (a): Laravel panelin sözleşmesine uyar, dolayısıyla burada
 * ağır bir çeviri YOKTUR. Bu katman **izolasyon** için var:
 *
 *  - D1 gibi bilinçli sapmalar (crudPropertyName → her yerde "id") tek yerde durur,
 *  - ileride backend ile sözleşme arasında fark çıkarsa değişiklik SADECE buraya iner,
 *  - sayfa/form/tablo kodu backend'in Laravel olduğunu asla bilmez.
 *
 * Kural: bu klasörün dışında hiçbir dosya alan adı eşlemesi veya zarf
 * normalizasyonu yapmaz.
 */
import type { IBaseResponse } from "@common/types/IBaseResponse";
import type { IListRequest } from "@common/types/IListRequest";
import type { IMetadata } from "@common/types/IMetadata";
import type { ITableResponse } from "@opsTable/types/ITableResponse";

// ── D1: CRUD anahtarı ─────────────────────────────────────────────────

/**
 * Detay/silme uçlarında kullanılan sorgu parametresi adı.
 *
 * Eski API'de modülden modüle değişiyordu (`id`, `UserId`, `TenantId`,
 * `ProjectId`…). D1 ile her yerde `id`. Bir modül istisna gerektirirse
 * istisna BURADA tanımlanır, çağrı yerinde değil.
 */
export const CRUD_KEY = "id" as const;

/** `GET {detailUrl}?id=123` için sorgu parametreleri. */
export const buildDetailParams = (
  id: string | number,
  key: string = CRUD_KEY
): Record<string, string | number> => ({ [key]: id });

// ── Liste isteği / yanıtı ─────────────────────────────────────────────

/**
 * Tablo durumunu liste isteği gövdesine çevirir.
 * Sözleşme: PATCH + `{ pageNumber, rowCount, filtering?, sorting?, aggregation? }`
 */
export const toListRequest = (
  request: IListRequest,
  extraParams?: Record<string, unknown>
): Record<string, unknown> => ({
  ...request,
  ...extraParams,
});

/**
 * Liste yanıtını normalize eder.
 *
 * Sayfalama alanları zarfın kökündedir; eksik gelirlerse tablo NaN'a düşmesin
 * diye güvenli varsayılanlar uygulanır.
 */
export const fromListResponse = <T>(
  response: ITableResponse<T>
): ITableResponse<T> => ({
  ...response,
  data: response?.data ?? [],
  metadatas: response?.metadatas ?? [],
  currentPageNumber: response?.currentPageNumber ?? 1,
  totalPageCount: response?.totalPageCount ?? 0,
  totalDataCount: response?.totalDataCount ?? 0,
  aggregationResults: response?.aggregationResults ?? [],
});

// ── Lookup ────────────────────────────────────────────────────────────

export interface ILookupParameter {
  entityName: string;
  requestedPropertyNames: string[];
  filtering?: IListRequest["filtering"];
  sorting?: IListRequest["sorting"];
}

/**
 * Entity lookup gövdesi.
 *
 * ⚠️ Uç **PATCH** `/v1/Lookups` ve gövde `parameters` DİZİSİ ile sarılır.
 * (REBUILD_PROMPT §3.6 bunu `POST /lookups` + düz gövde olarak tarif ediyordu;
 * yanlış — bkz. docs/API_ADAPTER.md §3.6.)
 */
export const toLookupRequest = (
  ...parameters: ILookupParameter[]
): { parameters: ILookupParameter[] } => ({ parameters });

/** Enum lookup sorgu parametreleri — uç **GET** `/v1/Lookups/enum`. */
export const toEnumLookupParams = (enumName: string) => ({ enumName });

// ── Zarf ──────────────────────────────────────────────────────────────

/**
 * Yanıt zarfını normalize eder.
 *
 * Bazı hata yanıtları serileştiriciden PascalCase geçiyor; tüketiciler tek bir
 * camelCase şekil görsün diye burada tekilleştirilir.
 */
export const normalizeEnvelope = <T>(raw: any): IBaseResponse<T> => ({
  messages: raw?.messages ?? raw?.Messages ?? [],
  statusCode: raw?.statusCode ?? raw?.StatusCode ?? 0,
  isSuccess: raw?.isSuccess ?? raw?.IsSuccess ?? false,
  data: raw?.data ?? raw?.Data,
  metadatas: raw?.metadatas ?? raw?.Metadatas ?? [],
});

// ── Metadata ──────────────────────────────────────────────────────────

/**
 * Metadata girdilerini tablo için güvenli hâle getirir.
 *
 * Seçenek A (docs/API_ADAPTER.md §3.3): metadata'yı API üretir. Burada yalnızca
 * eksik alanlar için varsayılan uygulanır — client tarafında kolon TANIMI
 * yapılmaz.
 */
export const buildMetadata = (metadatas?: IMetadata[] | null): IMetadata[] =>
  (metadatas ?? []).map((meta) => ({
    ...meta,
    localizedName: meta.localizedName || meta.name,
    display: meta.display ?? true,
    pinned: meta.pinned ?? false,
    mask: meta.mask ?? false,
    filterable: meta.filterable ?? false,
    metadatas: meta.metadatas ?? null,
  }));
