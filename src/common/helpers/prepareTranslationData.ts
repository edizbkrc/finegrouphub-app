import type { IFormItem } from "@common/types/IFormItem";
import type { ILanguageDto } from "@common/types/ILanguageDto";
import { hasTranslationsChanged } from "./hasTranslationsChanged";
import { transformTranslations } from "./transformTranslations";

/**
 * `LANGUAGE_*` alanlarını submit gövdesinden çıkarıp tek bir `translations[]`
 * dizisine düzleştirir. Yalnızca gerçekten değişiklik varsa gövdeye eklenir
 * (docs/API_ADAPTER.md §3.9).
 */
export const prepareTranslationData = (
  schemeList: IFormItem[],
  formData: Record<string, unknown>,
  translations: Record<string, unknown>[] | undefined,
  supportedLanguage: ILanguageDto[]
) => {
  const hasTranslation = schemeList.some((s) => s.type.startsWith("LANGUAGE_"));
  if (!hasTranslation) return formData;

  const translationKeys = schemeList.filter((s) => s.type.startsWith("LANGUAGE_")).map((s) => s.name);

  const translationArray = transformTranslations(
    formData as Record<string, Record<string, unknown>>,
    translationKeys,
    supportedLanguage
  );

  const result = { ...formData };
  translationKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(result, key)) delete result[key];
  });

  if (hasTranslationsChanged((translations ?? []) as never, translationArray as never)) {
    return { ...result, translations: translationArray };
  }

  return result;
};
