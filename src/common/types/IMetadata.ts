import { IDecimalPrecision } from "./IDecimalPrecision";

export interface IMetadata {
  name: string;
  localizedName: string;
  type: string;
  display: boolean;
  pinned: boolean;
  mask: boolean;
  /** Toplama (aggregation) yalnızca bu true ise kolon için sunulur. */
  aggregatable?: boolean;
  filterable: boolean;
  filterFormat: string | null;
  defaultValue: any;
  decimalPrecision: IDecimalPrecision | null;
  displayFormat: string | null;
  filterComponentType: string | null;
  /** `filterComponentType: "select"` için seçenekler (enum/lookup); yoksa null. */
  options?: unknown[] | null;
  /** Alan için ipucu metni (çevrilmiş) veya null. */
  info?: string | null;
  tooltipFormat: string | null;
  metadatas: IMetadata[] | null;
}
