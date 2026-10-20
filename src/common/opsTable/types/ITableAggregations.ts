import { AggregationTypeEnum } from "@common/enums/AggregationTypeEnum";

export interface ITableAggregations {
  column: string;
  type: AggregationTypeEnum;
  value?: any;
}
