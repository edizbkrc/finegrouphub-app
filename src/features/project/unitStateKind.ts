/** API UnitStateKind ile aynı. */
export enum UnitStateKind {
  Suitable = 1,
  Sold = 2,
  Reserved = 3,
  NonSellable = 4,
  Other = 5,
}

/** Uygun / Satıldı / Rezerve — silinemez, yalnız adı değişebilir. */
export function isProtectedUnitStateKind(kind: number | null | undefined): boolean {
  return kind === UnitStateKind.Suitable || kind === UnitStateKind.Sold || kind === UnitStateKind.Reserved;
}
