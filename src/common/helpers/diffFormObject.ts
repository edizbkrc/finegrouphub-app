/**
 * `apiData` ile `newData`'yı karşılaştırıp yalnızca değişen alanları
 * `{ value, isUpdated: true }` zarfıyla döndürür.
 *
 * Bu, kısmi güncelleme (partial PUT) sözleşmesinin temelidir — mimarinin
 * varsayımı budur, tercih değil (docs/API_ADAPTER.md §3.7). Gönderilmeyen
 * alanlara Laravel tarafında dokunulmamalı.
 */
export const diffFormObject = (
  apiData: Record<string, any>,
  newData: Record<string, any>,
  getDefaultValues?: (key: string, apiData: Record<string, any>) => Record<string, any> | null
): Record<string, any> => {
  const diff: Record<string, any> = {};

  const compareObjects = (oldObj: any, newObj: any): boolean => {
    if (Array.isArray(newObj) && Array.isArray(oldObj)) {
      return JSON.stringify([...newObj].sort()) !== JSON.stringify([...oldObj].sort());
    }
    if (Array.isArray(newObj) || Array.isArray(oldObj)) return true;

    if (newObj instanceof Date && oldObj instanceof Date) {
      return newObj.getTime() !== oldObj.getTime();
    }

    if (typeof newObj === "object" && typeof oldObj === "object" && newObj !== null && oldObj !== null) {
      return Object.keys({ ...newObj, ...oldObj }).some((key) => compareObjects(oldObj[key], newObj[key]));
    }

    return newObj != oldObj;
  };

  Object.keys(newData).forEach((key) => {
    const newValue = newData[key];
    const oldValue = apiData[key];

    if (!compareObjects(oldValue, newValue)) return;

    if (Array.isArray(newValue)) {
      diff[key] = { value: newValue, isUpdated: true };
      return;
    }

    if (typeof newValue === "object" && newValue !== null) {
      if (Object.keys(newValue).length === 0) return;

      const defaultValues = getDefaultValues?.(key, apiData);

      diff[key] =
        defaultValues === null
          ? { value: newValue, isUpdated: true }
          : { value: newValue === null ? newValue : { ...defaultValues, ...newValue }, isUpdated: true };

      return;
    }

    diff[key] = { value: newValue, isUpdated: true };
  });

  return diff;
};
