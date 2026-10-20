import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";

/** Tam sayfa form şemasındaki iç içe (multiSchema) kartları tek düz IFormItem listesine indirger. */
export function flattenSchemas(items: IOpsPageFormItem[]): IFormItem[] {
  const result: IFormItem[] = [];

  const processItem = (item: IOpsPageFormItem) => {
    if (item.schema) result.push(...item.schema);
    item.multiSchema?.forEach(processItem);
  };

  items.forEach(processItem);

  return result;
}
