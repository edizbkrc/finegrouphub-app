import { AggregationTypeEnum } from "@common/enums/AggregationTypeEnum";

export interface IAggregationCriteria {
  aggregateBy: string;
  type: AggregationTypeEnum;
}
