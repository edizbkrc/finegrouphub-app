import { IAggregationRequest } from "./IAggregationRequest";
import { IFilterRequest } from "./IFilterRequest";
import { ISortRequest } from "./ISortRequest";

export interface IListRequest {
  pageNumber: number;
  rowCount: number;
  filtering?: IFilterRequest;
  sorting?: ISortRequest;
  aggregation?: IAggregationRequest;
}
