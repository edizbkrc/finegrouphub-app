import type { ILanguageDto } from "@common/types/ILanguageDto";

/**
 * `apiData.translations[]`'ı `{ [alan]: { [dilKodu]: değer } }` şekline
 * düzleştirir — form input'larının `{ tr: "...", en: "..." }` beklediği yapı.
 *
 * Referansta bu fonksiyon MultiLangInput, MultiLangArrayInput, MultiLangEditor
 * ve MultiLangFileInput içinde birebir kopyalanmıştı; tek yere taşındı.
 */
export function reverseTransformTranslations(
  apiData: { translations?: Record<string, unknown>[] } | undefined,
  languages: ILanguageDto[]
): Record<string, Record<string, unknown>> {
  const formData: Record<string, Record<string, unknown>> = {};

  apiData?.translations?.forEach((translation) => {
    const language = languages.find((lang) => lang?.id === translation?.languageId);
    if (!language) return;

    Object.keys(translation).forEach((key) => {
      if (key === "languageId") return;
      formData[key] = formData[key] ?? {};
      formData[key][language.code] = translation[key];
    });
  });

  return formData;
}
