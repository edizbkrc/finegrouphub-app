import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";

export interface IFilterCriteria {
  filterBy?: string;
  otherValue?: any;
  value?: any;
  type?: FilterTypeEnum;
}
