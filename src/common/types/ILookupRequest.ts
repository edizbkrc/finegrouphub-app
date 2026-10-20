import { IFilterRequest } from "./IFilterRequest";
import { ISortRequest } from "./ISortRequest";

export interface ILookupRequest {
  entityName: string;
  requestedPropertyNames: string[];
  filtering?: IFilterRequest;
  sorting?: ISortRequest;
}
