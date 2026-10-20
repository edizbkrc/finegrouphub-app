/**
 * Gelişmiş Mülk Arama'nın saf filtre mantığı. React'e bağımlı değil: ekran yalnız durumu tutar,
 * süzme/seçenek üretme burada yapılır ki gerçek API verisiyle betikten de denenebilsin.
 *
 * Bütün süzme istemcide: ekran projenin tüm dairelerini zaten çekiyor (proje başına birkaç yüz),
 * her filtre değişiminde API'ye gitmek hem gereksiz hem de liste ucunun filtre sözleşmesine
 * (projectId tuzağı, bkz. CLAUDE.md #1) bağımlı olurdu.
 */

export interface UnitSearchRow {
  id: number;
  tags: string;
  unitNumber: string;
  floorNumber: number;
  unitTypeId: number;
  unitTypeName: string;
  unitTemplateName: string;
  /** "3+1" biçiminde; tip/şablon adından türetilir, ofis/dükkan gibi tiplerde null. */
  roomCount: string | null;
  currentStateId: number | null;
  currentStateName: string;
  stageName: string;
  grossArea: number;
  netArea: number;
  /** Ham Facade enum değerleri (1 Kuzey … 8 Güneybatı, 9 Hepsi). */
  facades: number[];
  /** Fiyatı girilmemiş dairede null (çoğu projede fiyat boş). */
  price: number | null;
  blockId: number | null;
  blockName: string;
  entrance: string;
}

/** null sınır = o yönde sınırsız. İkisi de null ise filtre kapalıdır. */
export interface RangeValue {
  min: number | null;
  max: number | null;
}

export interface RangeBounds {
  min: number;
  max: number;
  step: number;
}

export interface UnitSearchFilterState {
  query: string;
  typeId: number | null;
  stateId: number | null;
  entrance: string | null;
  rooms: string[];
  facades: number[];
  floor: RangeValue;
  netArea: RangeValue;
  grossArea: RangeValue;
  price: RangeValue;
}

export type RangeKey = "floor" | "netArea" | "grossArea" | "price";

export const EMPTY_RANGE: RangeValue = { min: null, max: null };

export const INITIAL_FILTERS: UnitSearchFilterState = {
  query: "",
  typeId: null,
  stateId: null,
  entrance: null,
  rooms: [],
  facades: [],
  floor: EMPTY_RANGE,
  netArea: EMPTY_RANGE,
  grossArea: EMPTY_RANGE,
  price: EMPTY_RANGE,
};

/**
 * Panelin çeviri dosyasında `Facades.0…9` var; listede bilinmeyen bir değer gelirse
 * next-intl eksik anahtarda patlayacağı için seçeneklere hiç alınmaz. 0 ("Yok") süzmede anlamsız.
 */
const KNOWN_FACADES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
/** Facade.All: her yöne bakan daire hangi cephe seçilirse seçilsin eşleşmeli. */
const FACADE_ALL = 9;

// "4+1", "2,5+1", "3 + 1 Dubleks" … İlk eşleşme oda sayısıdır; şablon adındaki ek ("B PLUS") atılır.
const ROOM_PATTERN = /(\d+(?:[.,]5)?)\s*\+\s*(\d+)/;

/** Oda sayısını önce tipten, yoksa şablon adından türetir (Fine3D de tip adını oda sayısı sayar). */
export function deriveRoomCount(...names: Array<string | null | undefined>): string | null {
  for (const name of names) {
    const match = name ? ROOM_PATTERN.exec(name) : null;
    if (match) return `${match[1].replace(".", ",")}+${match[2]}`;
  }
  return null;
}

function transName(raw: unknown): string {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (!Array.isArray(raw) || raw.length === 0) return "";
  const first = raw[0] as Record<string, unknown>;
  return String(first?.name ?? first?.Name ?? "").trim();
}

function positiveNumber(raw: unknown): number | null {
  // Fiyat API'den hassasiyet kaybolmasın diye metin gelir ("1250000.50"); süzme için sayı yeter.
  const value = typeof raw === "string" ? Number(raw.replace(",", ".")) : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Liste ucunun satırını (camelCase; eski .NET yanıtı için PascalCase de) ekran satırına çevirir. */
export function asUnit(raw: Record<string, unknown>): UnitSearchRow | null {
  const id = Number(raw.id ?? raw.Id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const block = (raw.block ?? raw.Block) as { id?: number; Id?: number; name?: string; Name?: string } | null;
  const unitTypeName = String(raw.unitTypeName ?? raw.UnitTypeName ?? transName(raw.unitTypeTranslations) ?? "").trim();
  const unitTemplateName = String(raw.unitTemplateName ?? raw.UnitTemplateName ?? transName(raw.templateTranslations) ?? "").trim();
  const rawFacades = raw.facades ?? raw.Facades;
  return {
    id,
    tags: String(raw.tags ?? raw.Tags ?? "").trim(),
    unitNumber: String(raw.unitNumber ?? raw.UnitNumber ?? "").trim(),
    floorNumber: Number(raw.floorNumber ?? raw.FloorNumber ?? 0),
    unitTypeId: Number(raw.unitTypeId ?? raw.UnitTypeId ?? 0),
    unitTypeName,
    unitTemplateName,
    roomCount: deriveRoomCount(unitTypeName, unitTemplateName),
    currentStateId: raw.currentStateId == null && raw.CurrentStateId == null ? null : Number(raw.currentStateId ?? raw.CurrentStateId),
    currentStateName: String(raw.currentStateName ?? raw.CurrentStateName ?? transName(raw.currentStateTranslations) ?? "").trim(),
    stageName: String(raw.stageName ?? raw.StageName ?? transName(raw.projectStageTranslations) ?? "").trim(),
    grossArea: Number(raw.grossArea ?? raw.GrossArea ?? 0) || 0,
    netArea: Number(raw.netArea ?? raw.NetArea ?? 0) || 0,
    facades: Array.isArray(rawFacades) ? rawFacades.map(Number).filter((value) => Number.isInteger(value)) : [],
    price: positiveNumber(raw.price ?? raw.Price),
    blockId: block?.id ?? block?.Id ?? null,
    blockName: String(block?.name ?? block?.Name ?? "").trim(),
    entrance: String(raw.entrance ?? raw.Entrance ?? "").trim(),
  };
}

/** Aralık filtresinin okuduğu değer. 0/boş alan ve fiyat "bilinmiyor" sayılır (null). */
export function rangeValueOf(unit: UnitSearchRow, key: RangeKey): number | null {
  switch (key) {
    case "floor":
      // Kat 0 (zemin) ve eksi katlar gerçek değer; bilinmeyen kat yok.
      return unit.floorNumber;
    case "netArea":
      return unit.netArea > 0 ? unit.netArea : null;
    case "grossArea":
      return unit.grossArea > 0 ? unit.grossArea : null;
    case "price":
      return unit.price;
  }
}

export function isRangeActive(range: RangeValue): boolean {
  return range.min != null || range.max != null;
}

/**
 * Filtre açıkken değeri bilinmeyen daire elenir: "120–150 m²" diyen kullanıcıya alanı girilmemiş
 * daireyi göstermek yanıltıcı olur. (Fine3D'de aralık hep açık olduğu için 0'ları geçiriyor; burada
 * filtre yalnız daraltılınca açık, o yüzden davranış farkı bilinçli.)
 */
export function matchesRange(value: number | null, range: RangeValue): boolean {
  if (!isRangeActive(range)) return true;
  if (value == null) return false;
  if (range.min != null && value < range.min) return false;
  if (range.max != null && value > range.max) return false;
  return true;
}

export function matchesQuery(unit: UnitSearchRow, query: string): boolean {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return true;
  return [
    unit.tags,
    unit.unitNumber,
    unit.blockName,
    unit.unitTypeName,
    unit.currentStateName,
    unit.stageName,
    unit.entrance,
    String(unit.floorNumber),
  ].some((value) => value.toLocaleLowerCase("tr-TR").includes(q));
}

export function matchesFacades(unit: UnitSearchRow, selected: number[]): boolean {
  if (selected.length === 0) return true;
  if (unit.facades.includes(FACADE_ALL)) return true;
  return unit.facades.some((facade) => selected.includes(facade));
}

export function matchesFilters(unit: UnitSearchRow, filters: UnitSearchFilterState): boolean {
  if (!matchesQuery(unit, filters.query)) return false;
  if (filters.typeId != null && unit.unitTypeId !== filters.typeId) return false;
  if (filters.stateId != null && unit.currentStateId !== filters.stateId) return false;
  if (filters.entrance != null && unit.entrance !== filters.entrance) return false;
  if (filters.rooms.length > 0 && (unit.roomCount == null || !filters.rooms.includes(unit.roomCount))) return false;
  if (!matchesFacades(unit, filters.facades)) return false;
  if (!matchesRange(rangeValueOf(unit, "floor"), filters.floor)) return false;
  if (!matchesRange(rangeValueOf(unit, "netArea"), filters.netArea)) return false;
  if (!matchesRange(rangeValueOf(unit, "grossArea"), filters.grossArea)) return false;
  if (!matchesRange(rangeValueOf(unit, "price"), filters.price)) return false;
  return true;
}

export function applyFilters(units: UnitSearchRow[], filters: UnitSearchFilterState): UnitSearchRow[] {
  return units.filter((unit) => matchesFilters(unit, filters));
}

/** Metin araması sayılmaz: rozet ve "Filtreleri temizle" yalnız seçilebilir filtreleri kapsar. */
export function countActiveFilters(filters: UnitSearchFilterState): number {
  return [
    filters.typeId != null,
    filters.stateId != null,
    filters.entrance != null,
    filters.rooms.length > 0,
    filters.facades.length > 0,
    isRangeActive(filters.floor),
    isRangeActive(filters.netArea),
    isRangeActive(filters.grossArea),
    isRangeActive(filters.price),
  ].filter(Boolean).length;
}

/** Arama metni korunur; kullanıcı süzgeçleri sıfırlarken yazdığını kaybetmesin. */
export function clearFilters(filters: UnitSearchFilterState): UnitSearchFilterState {
  return { ...INITIAL_FILTERS, query: filters.query };
}

function compareRoomCount(a: string, b: string): number {
  const [roomsA, hallsA] = a.split("+").map((part) => Number(part.replace(",", ".")));
  const [roomsB, hallsB] = b.split("+").map((part) => Number(part.replace(",", ".")));
  return roomsA - roomsB || hallsA - hallsB;
}

export function roomOptions(units: UnitSearchRow[]): string[] {
  const set = new Set<string>();
  for (const unit of units) if (unit.roomCount) set.add(unit.roomCount);
  return Array.from(set).sort(compareRoomCount);
}

export function facadeOptions(units: UnitSearchRow[]): number[] {
  const set = new Set<number>();
  for (const unit of units) for (const facade of unit.facades) if (KNOWN_FACADES.has(facade)) set.add(facade);
  return Array.from(set).sort((a, b) => a - b);
}

/** Fiyat gibi büyük aralıklarda slider ~100 adımda gezilsin diye 1/2/5×10ⁿ adım seçer. */
export function niceStep(span: number): number {
  if (!Number.isFinite(span) || span <= 100) return 1;
  const raw = span / 100;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
}

/**
 * Verideki değer aralığı (slider uçları). Değeri olan daire yoksa null → o filtre gösterilmez.
 * Uçlar adıma yuvarlanır; 169.92 m² gibi ondalıklı alanlar slider'da dışarıda kalmasın diye
 * alt uç aşağı, üst uç yukarı yuvarlanır.
 */
export function rangeBounds(units: UnitSearchRow[], key: RangeKey): RangeBounds | null {
  let min = Infinity;
  let max = -Infinity;
  for (const unit of units) {
    const value = rangeValueOf(unit, key);
    if (value == null) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const step = niceStep(max - min);
  return { min: Math.floor(min / step) * step, max: Math.ceil(max / step) * step, step };
}

/** Aralık filtresi açıkken değeri olmadığı için elenecek daire sayısı (kullanıcıya not düşülür). */
export function countMissing(units: UnitSearchRow[], key: RangeKey): number {
  return units.reduce((count, unit) => (rangeValueOf(unit, key) == null ? count + 1 : count), 0);
}

/**
 * Slider'ın verdiği [alt, üst] çiftini filtreye çevirir: uca dayanan sınır null olur, böylece
 * slider'ı uçlara geri çeken kullanıcı filtreyi kapatmış olur (rozet sayısı da düşer).
 */
export function rangeFromSlider(value: [number, number], bounds: RangeBounds): RangeValue {
  const [low, high] = value[0] <= value[1] ? value : [value[1], value[0]];
  return {
    min: low <= bounds.min ? null : low,
    max: high >= bounds.max ? null : high,
  };
}

export function sliderValue(range: RangeValue, bounds: RangeBounds): [number, number] {
  const clamp = (value: number) => Math.min(bounds.max, Math.max(bounds.min, value));
  return [clamp(range.min ?? bounds.min), clamp(range.max ?? bounds.max)];
}

function groupSeparator(locale: string): string | null {
  try {
    const group = new Intl.NumberFormat(locale).formatToParts(11111).find((part) => part.type === "group")?.value;
    return group === "." || group === "," ? group : null;
  } catch {
    return null;
  }
}

/**
 * Sayı alanı girdisi: "" → sınır yok (null), "120,44" Türkçe ondalık kabul, yarım girdi → undefined.
 *
 * Basamak ayırıcı ayrıca tanınır: alanın placeholder'ı ve slider etiketleri dile göre biçimli
 * ("1.250.000"), kullanıcı fiyatı aynı biçimde yazınca eskiden "1.000" → 1, "1.250.000" → NaN
 * (filtre sessizce uygulanmıyordu) oluyordu. Yalnız tam 3'lü gruplar ayırıcı sayılır; "120,44"
 * ve "120.5" ondalık olarak kalır.
 */
export function parseBound(text: string, locale = "tr-TR"): number | null | undefined {
  const trimmed = text.replace(/\s/g, "");
  if (!trimmed) return null;
  const group = groupSeparator(locale);
  let normalized = trimmed.replace(",", ".");
  if (group) {
    const decimal = group === "." ? "," : ".";
    const grouped = new RegExp(`^-?\\d{1,3}(?:\\${group}\\d{3})+(?:\\${decimal}\\d*)?$`);
    if (grouped.test(trimmed)) normalized = trimmed.split(group).join("").replace(decimal, ".");
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}
