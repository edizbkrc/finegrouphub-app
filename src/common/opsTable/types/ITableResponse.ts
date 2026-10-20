import { IBaseResponse } from "@common/types/IBaseResponse";
import { IAggregationResult } from "./IAggregationResult";

/**
 * Liste yanıtı.
 *
 * Sayfalama alanları `data`'nın İÇİNDE değil, zarfın KÖKÜNDE — `data` ve
 * `metadatas` ile kardeş. (docs/API_ADAPTER.md §3.2)
 */
export interface ITableResponse<TDataItem> extends IBaseResponse<TDataItem[]> {
  currentPageNumber: number;
  totalPageCount: number;
  totalDataCount: number;
  aggregationResults: IAggregationResult[];
}
