import type { ILanguageDto } from "@common/types/ILanguageDto";

/**
 * Form'daki `{ [alan]: { [dilKodu]: değer } }` yapısını API'nin beklediği
 * `translations: [{ languageId, [alan]: değer }]` dizisine çevirir.
 * Hiçbir alanı dolu olmayan dil kaydı diziye eklenmez.
 */
export const transformTranslations = (
  formData: Record<string, Record<string, unknown>>,
  translationKeys: string[],
  languages: ILanguageDto[]
) => {
  const translationArray: Record<string, unknown>[] = [];

  languages.forEach((language) => {
    const { id: languageId, code: languageCode } = language;
    const translationObject: Record<string, unknown> = { languageId };

    translationKeys.forEach((key) => {
      if (formData[key]?.[languageCode] !== undefined) {
        translationObject[key] = formData[key][languageCode];
      }
    });

    const hasValidValue = Object.keys(translationObject)
      .filter((key) => key !== "languageId")
      .some((key) => {
        const value = translationObject[key];
        return value !== "" && value !== null && value !== undefined;
      });

    if (hasValidValue) translationArray.push(translationObject);
  });

  return translationArray;
};
