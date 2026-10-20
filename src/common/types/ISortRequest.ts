import { SortTypeEnum } from "@common/enums/SortTypeEnum";

export interface ISortRequest {
  sortBy: string;
  type: SortTypeEnum;
}
