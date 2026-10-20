import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";
import { TypeGroupEnum } from "@common/enums/TypeGroupEnum";

export const supportedFilterTypes: Record<
  TypeGroupEnum,
  Set<FilterTypeEnum>
> = {
  [TypeGroupEnum.Default]: new Set<FilterTypeEnum>([
    FilterTypeEnum.EqualTo,
    FilterTypeEnum.NotEqualTo,
  ]),
  [TypeGroupEnum.Select]: new Set<FilterTypeEnum>([
    FilterTypeEnum.EqualTo,
    FilterTypeEnum.NotEqualTo,
  ]),
  [TypeGroupEnum.Text]: new Set<FilterTypeEnum>([
    FilterTypeEnum.Contains,
    FilterTypeEnum.DoesNotContain,
    FilterTypeEnum.EndsWith,
    FilterTypeEnum.EqualTo,
    // FilterTypeEnum.IsEmpty,
    // FilterTypeEnum.IsNotEmpty,
    // FilterTypeEnum.IsNotNull,
    // FilterTypeEnum.IsNotNullNorWhiteSpace,
    // FilterTypeEnum.IsNull,
    // FilterTypeEnum.IsNullOrWhiteSpace,
    FilterTypeEnum.NotEqualTo,
    FilterTypeEnum.StartsWith,
  ]),
  [TypeGroupEnum.Number]: new Set<FilterTypeEnum>([
    FilterTypeEnum.Between,
    FilterTypeEnum.EqualTo,
    FilterTypeEnum.GreaterThan,
    FilterTypeEnum.GreaterThanOrEqualTo,
    FilterTypeEnum.LessThan,
    FilterTypeEnum.LessThanOrEqualTo,
    FilterTypeEnum.NotEqualTo,
  ]),
  [TypeGroupEnum.Boolean]: new Set<FilterTypeEnum>([
    FilterTypeEnum.EqualTo,
    FilterTypeEnum.NotEqualTo,
  ]),
  [TypeGroupEnum.Date]: new Set<FilterTypeEnum>([
    FilterTypeEnum.Between,
    FilterTypeEnum.DateEqualTo,
    FilterTypeEnum.GreaterThan,
    FilterTypeEnum.GreaterThanOrEqualTo,
    FilterTypeEnum.LessThan,
    FilterTypeEnum.LessThanOrEqualTo,
  ]),
};
