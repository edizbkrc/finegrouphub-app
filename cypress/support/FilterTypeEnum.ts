/**
 * `@common/enums/FilterTypeEnum` ile birebir aynı değerler — Cypress testleri
 * uygulama kaynak koduna import edemediği için ayrı bir kopya tutulur.
 */
export enum TestFilterTypeEnum {
  Between,
  Contains,
  DoesNotContain,
  StartsWith,
  EndsWith,
  EqualTo,
  NotEqualTo,
  GreaterThan,
  GreaterThanOrEqualTo,
  LessThan,
  LessThanOrEqualTo,
  DateEqualTo = 19,
}
