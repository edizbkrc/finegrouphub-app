import * as XLSX from "xlsx";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { transformTranslations } from "@common/helpers/transformTranslations";
import type { IFormItem } from "@common/types/IFormItem";
import type { ILanguageDto } from "@common/types/ILanguageDto";

/**
 * Form şemasından (`IFormItem[]`) Excel sütunları üretir, boş şablon çıkarır ve
 * doldurulmuş dosyayı API gövdesine çevirir.
 *
 * Şema tek kaynaktır: forma alan eklendiğinde Excel şablonu da kendiliğinden
 * değişir — ayrıca güncellenecek bir sütun listesi yoktur.
 */

export type ExcelCellKind = "text" | "number" | "boolean" | "date" | "id";

export interface IExcelColumn {
  /** Excel'deki başlık — kullanıcının gördüğü ad. */
  header: string;
  /** Hedef form alanı. */
  field: string;
  /** Yalnızca `LANGUAGE_*` alanlarında: hangi dilin sütunu. */
  languageCode?: string;
  kind: ExcelCellKind;
  required: boolean;
  hint: string;
}

/** Excel'e sığmayan alan tipleri (dosya, zengin metin, iç içe diziler). */
const UNSUPPORTED: FormItemTypeEnum[] = [
  FormItemTypeEnum.Image,
  FormItemTypeEnum.FILE,
  FormItemTypeEnum.S3_IMAGE,
  FormItemTypeEnum.Editor,
  FormItemTypeEnum.Password,
  FormItemTypeEnum.Label_Fields,
  FormItemTypeEnum.LANGUAGE_FILE,
  FormItemTypeEnum.LANGUAGE_EDITOR,
  FormItemTypeEnum.LANGUAGE_ARRAY_TEXT,
  FormItemTypeEnum.MultiArrayTextInput,
  FormItemTypeEnum.MultiArrayObjectInput,
  FormItemTypeEnum.PRICE_RANGES,
  FormItemTypeEnum.FEATURE_SPECIFICATIONS,
  FormItemTypeEnum.MUI_ICON_AUTOCOMPLETE,
];

const kindOf = (type: FormItemTypeEnum): ExcelCellKind => {
  switch (type) {
    case FormItemTypeEnum.NUMBER:
    case FormItemTypeEnum.Decimal:
      return "number";
    case FormItemTypeEnum.CHECKBOX:
    case FormItemTypeEnum.SWITCH:
      return "boolean";
    case FormItemTypeEnum.DATE:
    case FormItemTypeEnum.Date_Time:
      return "date";
    case FormItemTypeEnum.AUTO_COMPLETE:
      return "id";
    default:
      return "text";
  }
};

const hintOf = (kind: ExcelCellKind, required: boolean): string => {
  const base = {
    text: "Metin",
    number: "Sayı (ondalık için virgül veya nokta)",
    boolean: "Evet / Hayır",
    date: "Tarih (GG.AA.YYYY)",
    id: "Listedeki kaydın ID numarası",
  }[kind];
  return required ? `${base} — zorunlu` : base;
};

/** Şemayı Excel sütunlarına çevirir. `LANGUAGE_TEXT` her dil için ayrı sütun açar. */
export const schemeToColumns = (
  scheme: IFormItem[],
  translate: (key: string) => string,
  languages: ILanguageDto[]
): IExcelColumn[] => {
  const columns: IExcelColumn[] = [];

  scheme.forEach((item) => {
    if (UNSUPPORTED.includes(item.type)) return;

    const required = Boolean(item.registerOptions?.required);
    // labelText projeye özel, zaten çevrilmiş ad (ör. "Dükkan Alanı"); Excel kolonu da onu taşısın.
    const label = item.labelText ?? (() => {
      try {
        return translate(`Form.${item.label}`);
      } catch {
        return item.label;
      }
    })();

    if (item.type === FormItemTypeEnum.LANGUAGE_TEXT) {
      languages.forEach((language) => {
        columns.push({
          header: `${label} (${language.code})`,
          field: item.name,
          languageCode: language.code,
          kind: "text",
          required: required && language.isDefault,
          hint: hintOf("text", required && language.isDefault),
        });
      });
      return;
    }

    const kind = kindOf(item.type);
    columns.push({ header: label, field: item.name, kind, required, hint: hintOf(kind, required) });
  });

  return columns;
};

const DATA_SHEET = "Veri";
const HELP_SHEET = "Aciklama";

/** Başlık satırı + ayrı bir açıklama sayfası içeren boş şablon üretir. */
export const buildTemplateWorkbook = (columns: IExcelColumn[]): XLSX.WorkBook => {
  const book = XLSX.utils.book_new();

  const dataSheet = XLSX.utils.aoa_to_sheet([columns.map((column) => column.header)]);
  dataSheet["!cols"] = columns.map((column) => ({ wch: Math.max(14, column.header.length + 2) }));
  XLSX.utils.book_append_sheet(book, dataSheet, DATA_SHEET);

  const helpSheet = XLSX.utils.aoa_to_sheet([
    ["Sütun", "Beklenen değer"],
    ...columns.map((column) => [column.header, column.hint]),
    [],
    ["Not", "Yalnızca 'Veri' sayfası okunur. Başlık satırını değiştirmeyin."],
    ["Not", "Boş bırakılan zorunlu olmayan alanlar gönderilmez."],
  ]);
  helpSheet["!cols"] = [{ wch: 34 }, { wch: 52 }];
  XLSX.utils.book_append_sheet(book, helpSheet, HELP_SHEET);

  return book;
};

/** Tarayıcıda dosya indirir. */
export const downloadWorkbook = (book: XLSX.WorkBook, fileName: string) => {
  XLSX.writeFile(book, fileName, { bookType: "xlsx" });
};

export interface IParsedRow {
  /** Excel'deki satır numarası (başlık 1'dir) — hata mesajlarında gösterilir. */
  rowNumber: number;
  values: Record<string, unknown>;
  errors: string[];
}

const TRUE_WORDS = ["evet", "true", "1", "var", "yes", "e"];
const FALSE_WORDS = ["hayir", "hayır", "false", "0", "yok", "no", "h"];

const coerce = (raw: unknown, column: IExcelColumn): { value?: unknown; error?: string } => {
  if (raw === null || raw === undefined || raw === "") {
    return column.required ? { error: `${column.header}: zorunlu` } : {};
  }

  switch (column.kind) {
    case "number":
    case "id": {
      const normalized = typeof raw === "string" ? raw.replace(/\s/g, "").replace(",", ".") : raw;
      const parsed = Number(normalized);
      if (Number.isNaN(parsed)) return { error: `${column.header}: sayı değil ("${String(raw)}")` };
      return { value: parsed };
    }
    case "boolean": {
      if (typeof raw === "boolean") return { value: raw };
      const text = String(raw).trim().toLocaleLowerCase("tr");
      if (TRUE_WORDS.includes(text)) return { value: true };
      if (FALSE_WORDS.includes(text)) return { value: false };
      return { error: `${column.header}: Evet/Hayır bekleniyor ("${String(raw)}")` };
    }
    case "date": {
      // XLSX sayısal tarihleri Date'e çevirir (cellDates: true ile okunur).
      if (raw instanceof Date) return { value: raw.toISOString() };
      return { value: String(raw).trim() };
    }
    default:
      return { value: String(raw).trim() };
  }
};

/** Doldurulmuş dosyayı satır satır okur ve değerleri tiplerine çevirir. */
export const parseWorkbook = (book: XLSX.WorkBook, columns: IExcelColumn[]): IParsedRow[] => {
  const sheet = book.Sheets[DATA_SHEET] ?? book.Sheets[book.SheetNames[0]];
  if (!sheet) return [];

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, raw: false });
  if (matrix.length < 2) return [];

  const headers = (matrix[0] as unknown[]).map((cell) => String(cell ?? "").trim());
  const indexOf = new Map<string, number>();
  headers.forEach((header, index) => indexOf.set(header, index));

  return matrix.slice(1).map((row, offset) => {
    const parsed: IParsedRow = { rowNumber: offset + 2, values: {}, errors: [] };

    columns.forEach((column) => {
      const index = indexOf.get(column.header);
      if (index === undefined) {
        if (column.required) parsed.errors.push(`${column.header}: sütun dosyada yok`);
        return;
      }

      const { value, error } = coerce((row as unknown[])[index], column);
      if (error) parsed.errors.push(error);
      else if (value !== undefined) parsed.values[`${column.field}${column.languageCode ? `::${column.languageCode}` : ""}`] = value;
    });

    return parsed;
  });
};

/** Tamamen boş satırları (hiç değer yok) eler. */
export const dropEmptyRows = (rows: IParsedRow[]): IParsedRow[] =>
  rows.filter((row) => Object.keys(row.values).length > 0 || row.errors.length > 0);

/**
 * Bir satırı API gövdesine çevirir. `LANGUAGE_*` sütunları `translations[]`
 * dizisine, diğerleri doğrudan alanlara yazılır.
 */
export const rowToPayload = (
  row: IParsedRow,
  scheme: IFormItem[],
  languages: ILanguageDto[]
): Record<string, unknown> => {
  const flat: Record<string, unknown> = {};
  const grouped: Record<string, Record<string, unknown>> = {};

  Object.entries(row.values).forEach(([key, value]) => {
    const [field, languageCode] = key.split("::");
    if (languageCode) {
      grouped[field] = { ...(grouped[field] ?? {}), [languageCode]: value };
    } else {
      flat[field] = value;
    }
  });

  const translationKeys = Object.keys(grouped);
  if (translationKeys.length === 0) return flat;

  const translations = transformTranslations(grouped, translationKeys, languages);
  return translations.length ? { ...flat, translations } : flat;
};

export const hasExcelSupport = (scheme: IFormItem[]): boolean =>
  scheme.some((item) => !UNSUPPORTED.includes(item.type));
