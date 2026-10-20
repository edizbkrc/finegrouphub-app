import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";

const FilterTypeValueCount: Record<FilterTypeEnum, number> = {
  [FilterTypeEnum.Between]: 2,
  [FilterTypeEnum.Contains]: 1,
  [FilterTypeEnum.DoesNotContain]: 1,
  [FilterTypeEnum.StartsWith]: 1,
  [FilterTypeEnum.EndsWith]: 1,
  [FilterTypeEnum.EqualTo]: 1,
  [FilterTypeEnum.NotEqualTo]: 1,
  [FilterTypeEnum.GreaterThan]: 1,
  [FilterTypeEnum.GreaterThanOrEqualTo]: 1,
  [FilterTypeEnum.LessThan]: 1,
  [FilterTypeEnum.LessThanOrEqualTo]: 1,
  [FilterTypeEnum.DateEqualTo]: 1,
  // [FilterTypeEnum.IsEmpty]: 0,
  // [FilterTypeEnum.IsNotEmpty]: 0,
  // [FilterTypeEnum.IsNull]: 0,
  // [FilterTypeEnum.IsNotNull]: 0,
  // [FilterTypeEnum.IsNullOrWhiteSpace]: 0,
  // [FilterTypeEnum.IsNotNullNorWhiteSpace]: 0,
  // [FilterTypeEnum.In]: 1,
  // [FilterTypeEnum.NotIn]: 1,
};

export function getFilterValueCount(filterType?: FilterTypeEnum): number {
  if (filterType === undefined) return 1;

  return FilterTypeValueCount[filterType];
}
