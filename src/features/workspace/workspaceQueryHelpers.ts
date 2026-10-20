import queryString from "query-string";
import { EntityTypeEnum, type LookupOption } from "./EntityTypeEnum";

/** Çalışma alanı filtreleri — F5 sonrası aynı yerde kalsın diye URL’de tutulur. */
export interface IWorkspaceQueryParams {
  entityType?: number;
  entityId?: string;
  selectedStageId?: string;
  selectedStageTitle?: string;
  selectedBlockId?: string;
  selectedBlockTitle?: string;
  selectedFloorId?: string;
  selectedFloorTitle?: string;
  selectedUnitId?: string;
  selectedUnitTitle?: string;
  selectedDollhouseId?: string;
  selectedDollhouseTitle?: string;
  selectedUnitTemplateId?: string;
  selectedUnitTemplateTitle?: string;
  selectedWorkspaceItemId?: string;
  presentationType?: number;
  polygonTypeFilter?: number | null;
  onlyMainFrames?: boolean;
}

export function workspaceQueryToParams(query: string): IWorkspaceQueryParams {
  if (!query) return {};

  const parsed = queryString.parse(query);
  const asString = (value: unknown): string | undefined =>
    typeof value === "string" && value.length > 0 ? value : undefined;
  const asNumber = (value: unknown): number | undefined => {
    const raw = asString(value);
    if (raw == null) return undefined;
    const num = Number(raw);
    return Number.isFinite(num) ? num : undefined;
  };

  const polygonRaw = asString(parsed.polygonTypeFilter);
  let polygonTypeFilter: number | null | undefined;
  if (polygonRaw === "all") polygonTypeFilter = null;
  else if (polygonRaw != null) {
    const num = Number(polygonRaw);
    polygonTypeFilter = Number.isFinite(num) ? num : undefined;
  }

  return {
    entityType: asNumber(parsed.entityType),
    entityId: asString(parsed.entityId),
    selectedStageId: asString(parsed.selectedStageId),
    selectedStageTitle: asString(parsed.selectedStageTitle),
    selectedBlockId: asString(parsed.selectedBlockId),
    selectedBlockTitle: asString(parsed.selectedBlockTitle),
    selectedFloorId: asString(parsed.selectedFloorId),
    selectedFloorTitle: asString(parsed.selectedFloorTitle),
    selectedUnitId: asString(parsed.selectedUnitId),
    selectedUnitTitle: asString(parsed.selectedUnitTitle),
    selectedDollhouseId: asString(parsed.selectedDollhouseId),
    selectedDollhouseTitle: asString(parsed.selectedDollhouseTitle),
    selectedUnitTemplateId: asString(parsed.selectedUnitTemplateId),
    selectedUnitTemplateTitle: asString(parsed.selectedUnitTemplateTitle),
    selectedWorkspaceItemId: asString(parsed.selectedWorkspaceItemId),
    presentationType: asNumber(parsed.presentationType),
    polygonTypeFilter,
    onlyMainFrames:
      parsed.onlyMainFrames === "1" ? true : parsed.onlyMainFrames === "0" ? false : undefined,
  };
}

export function workspaceParamsToQuery(params: IWorkspaceQueryParams): string {
  const query: Record<string, string | number | boolean> = {};

  if (params.entityType !== undefined) query.entityType = params.entityType;
  if (params.entityId) query.entityId = params.entityId;
  if (params.selectedStageId) query.selectedStageId = params.selectedStageId;
  if (params.selectedStageTitle) query.selectedStageTitle = params.selectedStageTitle;
  if (params.selectedBlockId) query.selectedBlockId = params.selectedBlockId;
  if (params.selectedBlockTitle) query.selectedBlockTitle = params.selectedBlockTitle;
  if (params.selectedFloorId) query.selectedFloorId = params.selectedFloorId;
  if (params.selectedFloorTitle) query.selectedFloorTitle = params.selectedFloorTitle;
  if (params.selectedUnitId) query.selectedUnitId = params.selectedUnitId;
  if (params.selectedUnitTitle) query.selectedUnitTitle = params.selectedUnitTitle;
  if (params.selectedDollhouseId) query.selectedDollhouseId = params.selectedDollhouseId;
  if (params.selectedDollhouseTitle) query.selectedDollhouseTitle = params.selectedDollhouseTitle;
  if (params.selectedUnitTemplateId) query.selectedUnitTemplateId = params.selectedUnitTemplateId;
  if (params.selectedUnitTemplateTitle) query.selectedUnitTemplateTitle = params.selectedUnitTemplateTitle;
  if (params.selectedWorkspaceItemId) query.selectedWorkspaceItemId = params.selectedWorkspaceItemId;
  if (params.presentationType !== undefined) query.presentationType = params.presentationType;
  if (params.polygonTypeFilter === null) query.polygonTypeFilter = "all";
  else if (params.polygonTypeFilter != null) query.polygonTypeFilter = params.polygonTypeFilter;
  if (params.onlyMainFrames === true) query.onlyMainFrames = "1";
  if (params.onlyMainFrames === false) query.onlyMainFrames = "0";

  return queryString.stringify(query, { skipNull: true, skipEmptyString: true });
}

export function updateWorkspaceQueryParams(params: IWorkspaceQueryParams) {
  if (typeof window === "undefined") return;
  const next = workspaceParamsToQuery(params);
  const current = new URL(window.location.href);
  if (current.search.replace(/^\?/, "") === next) return;
  current.search = next;
  window.history.replaceState({}, "", current.toString());
}

export function optionFromQuery(id?: string, title?: string): LookupOption | null {
  if (!id || !title) return null;
  const num = Number(id);
  return {
    id: Number.isFinite(num) && String(num) === id ? num : id,
    title,
  };
}

/** URL’deki entityType geçerli bir panel tipi mi? */
export function isWorkspaceEntityType(value: number | undefined): value is number {
  if (value == null || !Number.isFinite(value)) return false;
  return Object.values(EntityTypeEnum).includes(value);
}
