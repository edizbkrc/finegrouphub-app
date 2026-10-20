import { AggregationTypeEnum } from "@common/enums/AggregationTypeEnum";

/**
 * ⚠️ Referansta `case Max` İKİ KEZ yazılmış, `Count` ise hiç yoktu — Count
 * aggregation'ı seçildiğinde etiket "UNKNOWN" görünüyordu.
 */
const AGGREGATION_LABELS: Record<AggregationTypeEnum, string> = {
  [AggregationTypeEnum.Avg]: "Avg",
  [AggregationTypeEnum.Sum]: "Sum",
  [AggregationTypeEnum.Min]: "Min",
  [AggregationTypeEnum.Max]: "Max",
  [AggregationTypeEnum.Count]: "Count",
};

export function getAggregationTypeString(
  aggregationType: AggregationTypeEnum
): string {
  return AGGREGATION_LABELS[aggregationType] ?? "UNKNOWN";
}
