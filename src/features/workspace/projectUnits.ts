import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";
import { SortTypeEnum } from "@common/enums/SortTypeEnum";
import { VirtualTourEntityTypeEnum } from "@features/virtualtour/types/VirtualTourEntityTypeEnum";
import JSONbig from "json-bigint";
import { EntityTypeEnum } from "./EntityTypeEnum";
import { PolygonTypeEnum } from "./PolygonTypeEnum";
import type { ISvgPolygon } from "./types";

export interface IProjectUnit {
  id: number;
  tags: string;
  unitNumber: string;
  floorNumber: number;
  blockName: string;
}

export interface IWorkspaceFloor {
  id: number;
  number: number;
  templateName: string;
}

const POLYGON_TYPE_UNIT = 2;
const NAVIGATION_UNIT = 7;
const NAVIGATION_BLOCK = 5;
const NAVIGATION_VIRTUAL_TOUR = 1;
const NAVIGATION_URL = 2;
const NAVIGATION_PROJECT = 3;
const NAVIGATION_INFO_CARD = 9;

export interface IWorkspaceTour {
  id: string;
  name: string;
}

export interface IWorkspaceTourScene {
  id: string;
  name: string;
}

export interface IWorkspaceInfoCard {
  id: number;
  name: string;
}

export interface IWorkspaceBlock {
  id: number;
  name: string;
  stageId?: number;
}

/** Etap / mülk şablonu / minimap etiketine sanal tur bağlanabilir. */
export function entityAllowsVirtualTour(entityType: number | ""): boolean {
  return (
    entityType === EntityTypeEnum.ProjectStage ||
    entityType === EntityTypeEnum.UnitTemplate ||
    entityType === EntityTypeEnum.ProjectMinimap
  );
}

/** Etap çalışma alanında noktaya bilgi kartı bağlanır (Fine3D dot). Minimap’te yok. */
export function entityAllowsInfoCard(entityType: number | ""): boolean {
  return entityType === EntityTypeEnum.ProjectStage;
}

/** Blok / kat etiketine daire bağlanabilir. */
export function entityAllowsUnit(entityType: number | ""): boolean {
  return entityType === EntityTypeEnum.Block || entityType === EntityTypeEnum.Floor;
}

/** Etap ana frame etiketine blok bağlanır → Fine3D "A Blok" yazar. */
export function entityAllowsBlock(entityType: number | ""): boolean {
  return entityType === EntityTypeEnum.ProjectStage;
}

/** Etap navigasyon tipi: Proje. */
export function assignProjectToPolygon(polygon: ISvgPolygon, projectId: number): ISvgPolygon {
  return {
    ...polygon,
    entityType: null,
    relatedEntityId: null,
    navigationType: NAVIGATION_PROJECT,
    navigationId: projectId,
    navigationValue: null,
  };
}

export function polygonHasProject(polygon: ISvgPolygon | null | undefined): boolean {
  return Number(polygon?.navigationType) === NAVIGATION_PROJECT;
}

function asUnit(raw: Record<string, unknown>): IProjectUnit | null {
  const id = Number(raw.id ?? raw.Id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const block = (raw.block ?? raw.Block) as { name?: string; Name?: string } | null;
  return {
    id,
    tags: String(raw.tags ?? raw.Tags ?? "").trim(),
    unitNumber: String(raw.unitNumber ?? raw.UnitNumber ?? "").trim(),
    floorNumber: Number(raw.floorNumber ?? raw.FloorNumber ?? 0),
    blockName: String(block?.name ?? block?.Name ?? "").trim(),
  };
}

/** Projedeki kayıtlı daireler — yeni daire üretmez, yalnızca mevcutları okur. */
export async function fetchProjectUnits(projectId: number): Promise<IProjectUnit[]> {
  const collected: IProjectUnit[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await axiosInstance.patch(
      ApiRoutes.Units,
      {
        pageNumber: page,
        rowCount: 200,
        projectId,
        filtering: { criterias: [{ filterBy: "ProjectId", value: projectId, type: FilterTypeEnum.EqualTo }] },
        sorting: { sortBy: "tags", type: SortTypeEnum.Asc },
      },
      { withoutToast: true }
    );
    const rows = (response.data?.data ?? []) as Array<Record<string, unknown>>;
    for (const row of rows) {
      const unit = asUnit(row);
      if (unit) collected.push(unit);
    }
    totalPages = Number(response.data?.totalPageCount ?? 1) || 1;
    page += 1;
  } while (page <= totalPages);
  return collected;
}

export function unitLabel(unit: IProjectUnit | undefined, fallback: string): string {
  if (!unit) return fallback;
  // Çalışma alanında A1D2 gibi etiketler genelde tags; Fine3D için kayıtta unitNumber senkron tutulur.
  return unit.tags || unit.unitNumber || fallback;
}

export function unitMatches(unit: IProjectUnit, query: string): boolean {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return true;
  return [unit.tags, unit.unitNumber, unit.blockName, String(unit.floorNumber)].some((value) =>
    value.toLocaleLowerCase("tr-TR").includes(q)
  );
}

/** Poligon etiketinde görünen daire adı (tags) ve daire numarasını günceller. API yalnızca id döner. */
export async function updateProjectUnitFields(
  current: IProjectUnit,
  fields: { tags?: string; unitNumber?: string }
): Promise<IProjectUnit> {
  const payload: Record<string, unknown> = { id: current.id };
  if (fields.tags !== undefined) {
    payload.tags = { value: fields.tags, isUpdated: true };
  }
  if (fields.unitNumber !== undefined) {
    payload.unitNumber = { value: fields.unitNumber, isUpdated: true };
  }
  const response = await axiosInstance.put(ApiRoutes.UnitDetail, payload);
  if (!response.data?.isSuccess) {
    throw new Error(String(response.data?.message ?? "Unit update failed"));
  }
  return {
    ...current,
    tags: fields.tags !== undefined ? fields.tags : current.tags,
    unitNumber: fields.unitNumber !== undefined ? fields.unitNumber : current.unitNumber,
  };
}

/** Proje/etap blokları — Fine3D etiket metni için. */
export async function fetchProjectBlocks(projectId: number, stageId?: number): Promise<IWorkspaceBlock[]> {
  const body: Record<string, unknown> = {
    pageNumber: 1,
    rowCount: 500,
    projectId,
  };
  if (stageId != null && Number.isFinite(stageId) && stageId > 0) {
    body.projectStageId = stageId;
  }
  const response = await axiosInstance.patch(ApiRoutes.Blocks, body, { withoutToast: true });
  const rows = (response.data?.data ?? []) as Array<Record<string, unknown>>;
  const blocks: IWorkspaceBlock[] = [];
  for (const row of rows) {
    const id = Number(row.id ?? row.Id);
    if (!Number.isFinite(id) || id <= 0) continue;
    const stageId = Number(row.projectStageId ?? row.ProjectStageId ?? 0);
    blocks.push({
      id,
      name: String(row.name ?? row.Name ?? "").trim() || `#${id}`,
      ...(Number.isFinite(stageId) && stageId > 0 ? { stageId } : {}),
    });
  }
  return blocks;
}

export function blockLabel(block: IWorkspaceBlock | undefined, fallback: string): string {
  if (!block?.name) return fallback;
  // Fine3D de aynı: ad + " Blok"
  const trimmed = block.name.replace(/\s*blok\s*$/i, "").trim();
  return `${trimmed} Blok`;
}

export function blockMatches(block: IWorkspaceBlock, query: string): boolean {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return true;
  return block.name.toLocaleLowerCase("tr-TR").includes(q) || String(block.id).includes(q);
}

/** İşareti mevcut daireye bağlar; daire kaydı oluşturmaz. */
export function assignUnitToPolygon(polygon: ISvgPolygon, unit: IProjectUnit): ISvgPolygon {
  return {
    ...polygon,
    type: POLYGON_TYPE_UNIT,
    entityType: EntityTypeEnum.Unit,
    relatedEntityId: unit.id,
    navigationType: NAVIGATION_UNIT,
    navigationId: unit.id,
  };
}

/** Etap poligonunu bloğa bağlar — Fine3D üstünde "A Blok" çıkar. */
export function assignBlockToPolygon(polygon: ISvgPolygon, block: IWorkspaceBlock): ISvgPolygon {
  return {
    ...polygon,
    type: PolygonTypeEnum.Default,
    entityType: EntityTypeEnum.Block,
    relatedEntityId: block.id,
    navigationType: NAVIGATION_BLOCK,
    navigationId: block.id,
    navigationValue: null,
  };
}

export function clearPolygonUnit(polygon: ISvgPolygon): ISvgPolygon {
  return {
    ...polygon,
    entityType: null,
    relatedEntityId: null,
    navigationId: null,
    navigationType: 0,
    navigationValue: null,
  };
}

/** Proje veya mülk şablonundaki sanal turlar — etiket navigasyonu için. */
export async function fetchWorkspaceTours(
  projectId: number,
  entityType: number | "",
  entityId: number | ""
): Promise<IWorkspaceTour[]> {
  const isTemplate = entityType === EntityTypeEnum.UnitTemplate && typeof entityId === "number";
  const response = await axiosInstance.patch(
    ApiRoutes.VirtualTours,
    {
      pageNumber: 1,
      rowCount: 1000,
      entityId: isTemplate ? entityId : projectId,
      entityType: isTemplate ? VirtualTourEntityTypeEnum.UnitTemplate : VirtualTourEntityTypeEnum.Project,
    },
    {
      withoutToast: true,
      transformResponse: [
        (data: string) => {
          const parsed = JSON.parse(data);
          const big = JSONbig.parse(data);
          if (Array.isArray(parsed?.data) && Array.isArray(big?.data)) {
            parsed.data = parsed.data.map((row: { id?: unknown; name?: string; translations?: Array<{ name?: string }> }, index: number) => ({
              ...row,
              id: String(big.data[index]?.id ?? row.id),
            }));
          }
          return parsed;
        },
      ],
    }
  );
  const rows = (response.data?.data ?? []) as Array<{
    id?: unknown;
    name?: string;
    translations?: Array<{ name?: string; Name?: string; languageId?: number }>;
  }>;
  return rows
    .map((row) => {
      const id = String(row.id ?? "").trim();
      const fromTranslations =
        row.translations?.find((item) => item.name || item.Name)?.name ||
        row.translations?.find((item) => item.name || item.Name)?.Name ||
        "";
      const name = String(row.name ?? fromTranslations ?? "").trim() || (id ? `#${id}` : "");
      return { id, name };
    })
    .filter((tour) => tour.id.length > 0 && tour.id !== "undefined" && tour.id !== "null");
}

export function tourLabel(tour: IWorkspaceTour | undefined, fallback: string): string {
  return tour?.name || fallback;
}

export function polygonHasVirtualTour(polygon: ISvgPolygon | null | undefined): boolean {
  if (Number(polygon?.navigationType) !== NAVIGATION_VIRTUAL_TOUR) return false;
  const id = polygon?.navigationId;
  return id != null && String(id).trim() !== "" && String(id) !== "0";
}

/** Blok filtresine göre poligon görünür mü (Default her zaman kalır). */
export function polygonMatchesTypeFilter(
  polygon: ISvgPolygon,
  typeFilter: number | null
): boolean {
  if (typeFilter == null) return true;
  const type = Number(polygon.type ?? PolygonTypeEnum.Default);
  return type === typeFilter || type === PolygonTypeEnum.Default;
}

/** Bloğun katlarını okur — kat etiketi yazmak için. */
export async function fetchBlockFloors(blockId: number): Promise<IWorkspaceFloor[]> {
  const response = await axiosInstance.get(ApiRoutes.BlockDetail, {
    params: { BlockId: blockId },
    withoutToast: true,
  });
  if (!response?.data?.isSuccess) return [];
  const floors = (response.data?.data?.floors ?? []) as Array<Record<string, unknown>>;
  return floors
    .map((row) => {
      const id = Number(row.id ?? row.Id);
      if (!Number.isFinite(id) || id <= 0) return null;
      return {
        id,
        number: Number(row.number ?? row.Number ?? 0),
        templateName: String(row.templateName ?? row.TemplateName ?? "").trim(),
      } satisfies IWorkspaceFloor;
    })
    .filter((floor): floor is IWorkspaceFloor => floor != null);
}

export function floorLabel(floor: IWorkspaceFloor | undefined, fallback: string): string {
  if (!floor) return fallback;
  const numberPart = floor.number ? `${floor.number}. Kat` : fallback;
  return floor.templateName ? `${numberPart} (${floor.templateName})` : numberPart;
}

/** Overlay'de yalnızca bağlı daire, kat, blok veya tur adı yazılır; boş poligona "Etiket" basılmaz. */
export function polygonDisplayLabel(
  polygon: ISvgPolygon,
  unitsById: Map<number, IProjectUnit>,
  toursById: Map<string, IWorkspaceTour>,
  floorsById?: Map<number, IWorkspaceFloor>,
  typeFilter: number | null = null,
  blocksById?: Map<number, IWorkspaceBlock>,
  infoCardsById?: Map<number, IWorkspaceInfoCard>
): string {
  if (polygonHasVirtualTour(polygon)) {
    const tour = toursById.get(String(polygon.navigationId ?? ""));
    if (tour) return tourLabel(tour, "");
  }

  if (polygonHasInfoCard(polygon) && infoCardsById) {
    const card = infoCardsById.get(Number(polygon.navigationId));
    if (card) return infoCardLabel(card, "");
  }

  if (polygonHasUrl(polygon)) {
    return String(polygon.navigationValue ?? "").trim();
  }

  const relatedId = Number(polygon.relatedEntityId);
  if (!Number.isFinite(relatedId) || relatedId <= 0) return "";

  if (Number(polygon.entityType) === EntityTypeEnum.Block && blocksById) {
    const block = blocksById.get(relatedId);
    if (block) return blockLabel(block, "");
  }

  const polygonType = Number(polygon.type ?? PolygonTypeEnum.Default);
  const preferFloor =
    typeFilter === PolygonTypeEnum.Floor ||
    polygonType === PolygonTypeEnum.Floor ||
    Number(polygon.entityType) === EntityTypeEnum.Floor;

  if (preferFloor && floorsById) {
    const floor = floorsById.get(relatedId);
    if (floor) return floorLabel(floor, "");
  }

  const unit = unitsById.get(relatedId);
  if (unit) return unitLabel(unit, "");

  if (floorsById) {
    const floor = floorsById.get(relatedId);
    if (floor) return floorLabel(floor, "");
  }

  if (blocksById) {
    const block = blocksById.get(relatedId);
    if (block) return blockLabel(block, "");
  }

  return "";
}

/** Etiketi sanal tur + sahneye bağlar; navigationValue = sahne id. */
export function assignTourToPolygon(
  polygon: ISvgPolygon,
  tour: IWorkspaceTour,
  sceneId: string
): ISvgPolygon {
  return {
    ...polygon,
    entityType: null,
    relatedEntityId: null,
    navigationType: NAVIGATION_VIRTUAL_TOUR,
    navigationId: tour.id,
    navigationValue: sceneId,
  };
}

/** Sanal tur detayından sahneleri okur. */
export async function fetchVirtualTourScenes(
  projectId: number,
  tourId: string,
  entityType: number | "" = EntityTypeEnum.Project,
  entityId: number | "" = projectId
): Promise<IWorkspaceTourScene[]> {
  const isTemplate = entityType === EntityTypeEnum.UnitTemplate && typeof entityId === "number";
  const response = await axiosInstance.get(ApiRoutes.VirtualTourDetail, {
    withoutToast: true,
    params: {
      VirtualTourId: tourId,
      entityId: isTemplate ? entityId : projectId,
      entityType: isTemplate ? VirtualTourEntityTypeEnum.UnitTemplate : VirtualTourEntityTypeEnum.Project,
    },
  });
  if (!response?.data?.isSuccess) return [];
  const scenes = (response.data?.data?.scenes ?? []) as Array<Record<string, unknown>>;
  return scenes
    .map((scene) => {
      const id = String(scene.id ?? scene.Id ?? "").trim();
      if (!id) return null;
      const translations = (scene.translations ?? scene.Translations ?? []) as Array<{
        name?: string;
        languageId?: number;
      }>;
      const name =
        String(scene.name ?? scene.Name ?? "").trim() ||
        translations.find((row) => row.name)?.name ||
        `Sahne ${id.slice(0, 8)}`;
      return { id, name } satisfies IWorkspaceTourScene;
    })
    .filter((scene): scene is IWorkspaceTourScene => scene != null);
}

export function sceneLabel(scene: IWorkspaceTourScene | undefined, fallback: string): string {
  return scene?.name || fallback;
}

/** Projedeki bilgi kartları — minimap noktasına bağlamak için. */
export async function fetchProjectInfoCards(projectId: number): Promise<IWorkspaceInfoCard[]> {
  const response = await axiosInstance.patch(
    ApiRoutes.InfoCards,
    {
      pageNumber: 1,
      rowCount: 500,
      projectId,
      filtering: {
        criterias: [{ filterBy: "ProjectId", value: projectId, type: FilterTypeEnum.EqualTo }],
      },
      sorting: { sortBy: "displayOrder", type: SortTypeEnum.Asc },
    },
    { withoutToast: true }
  );
  const rows = (response.data?.data ?? []) as Array<Record<string, unknown>>;
  const cards: IWorkspaceInfoCard[] = [];
  for (const row of rows) {
    const id = Number(row.id ?? row.Id);
    if (!Number.isFinite(id) || id <= 0) continue;
    const name = String(row.name ?? row.Name ?? "").trim();
    cards.push({ id, name: name || `#${id}` });
  }
  return cards;
}

export function infoCardLabel(card: IWorkspaceInfoCard | undefined, fallback: string): string {
  return card?.name || fallback;
}

export function infoCardMatches(card: IWorkspaceInfoCard, query: string): boolean {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return true;
  return card.name.toLocaleLowerCase("tr-TR").includes(q) || String(card.id).includes(q);
}

export function polygonHasInfoCard(polygon: ISvgPolygon | null | undefined): boolean {
  if (Number(polygon?.navigationType) !== NAVIGATION_INFO_CARD) return false;
  const id = Number(polygon?.navigationId);
  return Number.isFinite(id) && id > 0;
}

/** Minimap noktasını bilgi kartına bağlar. */
export function assignInfoCardToPolygon(polygon: ISvgPolygon, card: IWorkspaceInfoCard): ISvgPolygon {
  return {
    ...polygon,
    entityType: null,
    relatedEntityId: null,
    navigationType: NAVIGATION_INFO_CARD,
    navigationId: card.id,
    navigationValue: null,
  };
}

export function polygonHasUrl(polygon: ISvgPolygon | null | undefined): boolean {
  if (Number(polygon?.navigationType) !== NAVIGATION_URL) return false;
  return Boolean(String(polygon?.navigationValue ?? "").trim());
}

/** Minimap noktasını harici URL'ye bağlar. */
export function assignUrlToPolygon(polygon: ISvgPolygon, url: string): ISvgPolygon {
  return {
    ...polygon,
    entityType: null,
    relatedEntityId: null,
    navigationType: NAVIGATION_URL,
    navigationId: null,
    navigationValue: url.trim(),
  };
}
