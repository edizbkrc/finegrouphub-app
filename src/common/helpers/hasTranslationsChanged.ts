interface ITranslationRecord {
  languageId: number;
  [key: string]: unknown;
}

/** Yalnızca değişiklik varsa `translations[]` gönderilsin diye karşılaştırma yapar. */
export const hasTranslationsChanged = (
  oldTranslations: ITranslationRecord[],
  newTranslations: ITranslationRecord[]
): boolean => {
  if (!oldTranslations?.length && !newTranslations?.length) return false;
  if (!oldTranslations?.length || !newTranslations?.length) return true;

  const newByLanguage = new Map(newTranslations.map((t) => [t.languageId, t]));

  for (const oldTranslation of oldTranslations) {
    const { languageId, ...oldProps } = oldTranslation;
    const newTranslation = newByLanguage.get(languageId);
    if (!newTranslation) return true;

    const { languageId: _newLangId, ...newProps } = newTranslation;
    // `target: es5` altında Set doğrudan for..of ile dolaşılamıyor.
    const keys = Array.from(new Set([...Object.keys(oldProps), ...Object.keys(newProps)]));

    for (const key of keys) {
      if (oldProps[key] !== newProps[key]) return true;
    }
  }

  return newTranslations.some(
    (newTranslation) => !oldTranslations.some((t) => t.languageId === newTranslation.languageId)
  );
};
