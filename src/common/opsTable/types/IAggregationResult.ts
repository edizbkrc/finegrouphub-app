import { AggregationTypeEnum } from "@common/enums/AggregationTypeEnum";

export interface IAggregationResult {
  aggregatedBy: string;
  type: AggregationTypeEnum;
  result: number | null;
}
