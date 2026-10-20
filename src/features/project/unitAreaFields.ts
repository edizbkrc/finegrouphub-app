/**
 * Mülk alan adları (Brüt / Net / Kapı içi) — proje bazında yeniden adlandırma ve gizleme.
 *
 * Bilgi ayrı uçta değil, `project.config.unitAreaFields` içinde gelir (FineProjects.Config jsonb).
 * Yeni kolon/uç açılmadı: şema .NET ile ortak (SchemaParityTest) ve API route'ları cache'li.
 * Aynı çözümleme kuralını Fine3D de uygular; ikisi ayrışırsa panel ile görüntüleyici farklı
 * etiket gösterir, bu yüzden kural burada tek yerde tutuluyor.
 */

export type UnitAreaFieldKey = "grossArea" | "netArea" | "indoorArea";

export interface IUnitAreaFieldTranslation {
  name?: string | null;
  languageId: number;
}

export interface IUnitAreaField {
  hidden?: boolean;
  translations?: IUnitAreaFieldTranslation[];
}

export type IUnitAreaFields = Partial<Record<UnitAreaFieldKey, IUnitAreaField | null>>;

export interface IResolvedUnitAreaField {
  hidden: boolean;
  label: string;
}

export type IResolvedUnitAreaFields = Record<UnitAreaFieldKey, IResolvedUnitAreaField>;

export const UNIT_AREA_FIELD_KEYS: UnitAreaFieldKey[] = ["grossArea", "netArea", "indoorArea"];

/** Varsayılan etiketlerin `Form.*` anahtarları; entity alan adlarıyla (GrossArea…) aynı. */
export const DEFAULT_LABEL_KEY: Record<UnitAreaFieldKey, string> = {
  grossArea: "GrossArea",
  netArea: "NetArea",
  indoorArea: "IndoorArea",
};

/**
 * Entity içerik dilleri API'de yalnız tr-TR (21) ve en-US (22). Panel dil listesini burada
 * getLanguages() ile çekmiyoruz: OpsForm içinde global languageLoading formu söküp kuruyor
 * ve sonsuz döngüye giriyor (CLAUDE.md "Panel formları").
 */
export const LANGUAGE_ID: Record<"tr" | "en", number> = { tr: 21, en: 22 };

export const languageIdOfLocale = (locale: string): number => (locale === "en" ? LANGUAGE_ID.en : LANGUAGE_ID.tr);

type Translate = (key: string, values?: Record<string, string | number | Date>) => string;

export const readUnitAreaFields = (project: unknown): IUnitAreaFields | null => {
  const config = (project as { config?: { unitAreaFields?: IUnitAreaFields | null } | null } | null)?.config;
  return config?.unitAreaFields ?? null;
};

/**
 * Sözleşme §3: alan yoksa görünür + varsayılan çeviri. Etiket yalnız AKTİF dilin çevirisinden
 * alınır; diller arası geri düşüş bilinçli olarak yok — EN arayüzde TR metin görünmesin.
 */
export const resolveUnitAreaFields = (
  fields: IUnitAreaFields | null | undefined,
  locale: string,
  t: Translate
): IResolvedUnitAreaFields => {
  const languageId = languageIdOfLocale(locale);

  const resolveOne = (key: UnitAreaFieldKey): IResolvedUnitAreaField => {
    const field = fields?.[key] ?? null;
    const custom = field?.translations?.find((row) => row?.languageId === languageId)?.name?.trim();
    return {
      hidden: field?.hidden === true,
      label: custom ? custom : t(`Form.${DEFAULT_LABEL_KEY[key]}`),
    };
  };

  return {
    grossArea: resolveOne("grossArea"),
    netArea: resolveOne("netArea"),
    indoorArea: resolveOne("indoorArea"),
  };
};

/**
 * Gizli alanlar için create gövdesine eklenecek sıfırlar. Alan formda yok ama kolonlar
 * sayısal ve .NET ile ortak; boş bırakmak yerine sözleşmedeki gibi açıkça 0 gönderiyoruz
 * (API gizli alanda `>0` kuralını atlıyor, 0'ı kabul ediyor).
 * Update'te kullanılmaz: gizli alan gönderilmez, DB'deki eski değer korunur.
 */
export const hiddenAreaZeros = (resolved: IResolvedUnitAreaFields | null | undefined): Partial<Record<UnitAreaFieldKey, number>> => {
  const zeros: Partial<Record<UnitAreaFieldKey, number>> = {};
  if (!resolved) return zeros;
  UNIT_AREA_FIELD_KEYS.forEach((key) => {
    if (resolved[key].hidden) zeros[key] = 0;
  });
  return zeros;
};

/**
 * Tablo kolonlarına projeye özel ad / gizlilik uygular. Başlıklar API metadata'sından
 * (Global.GrossArea…) geliyor ve proje bazlı değil. Metadata adı PascalCase ya da camelCase
 * gelebildiği için büyük/küçük harf duyarsız eşleniyor.
 */
export const applyUnitAreaFieldsToMetadata = <T extends { name: string; localizedName: string; display: boolean }>(
  metadatas: T[],
  resolved: IResolvedUnitAreaFields
): T[] =>
  metadatas.map((meta) => {
    const key = UNIT_AREA_FIELD_KEYS.find((item) => item.toLowerCase() === meta.name?.toLowerCase());
    if (!key) return meta;
    const field = resolved[key];
    return { ...meta, localizedName: field.label, display: field.hidden ? false : meta.display };
  });
