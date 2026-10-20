import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";
import { TypeGroupEnum } from "@common/enums/TypeGroupEnum";

export interface ITableFilters {
  column: string;
  operator?: FilterTypeEnum;
  value?: string;
  type: TypeGroupEnum;
  options?: string[];
  otherValue?: string;
}
