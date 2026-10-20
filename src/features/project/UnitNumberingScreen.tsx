"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Alert, Box, Chip, CircularProgress, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { OpsPageNames } from "@enums/OpsPageNames";
import { Routes } from "@enums/Routes";
import { usePageInformation } from "@hooks/usePageInformation";
import { SortTypeEnum } from "@common/enums/SortTypeEnum";
import { useProject, projectFilter } from "@/features/project/ProjectContext";
import ProjectSection from "@/features/project/ProjectSection";
import PolygonOverlay from "@/features/workspace/PolygonOverlay";
import WorkspaceUnitPicker from "@/features/workspace/WorkspaceUnitPicker";
import { EntityTypeEnum } from "@/features/workspace/EntityTypeEnum";
import { useWorkspaceLock } from "@/features/workspace/useWorkspaceLock";
import { PolygonTypeEnum } from "@/features/workspace/PolygonTypeEnum";
import {
  assignUnitToPolygon,
  clearPolygonUnit,
  fetchProjectUnits,
  polygonMatchesTypeFilter,
  unitLabel,
  type IProjectUnit,
} from "@/features/workspace/projectUnits";
import type { ISvgPolygon, IWorkspace, IWorkspaceItem } from "@/features/workspace/types";

interface IBlockOption {
  id: number;
  name: string;
}

/**
 * Görseldeki işaretlere projedeki mevcut daireleri bağlar (A5D2 gibi).
 * Yeni daire üretmez; tıklanınca listeden seçilir.
 */
export default function UnitNumberingScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const { enqueueSnackbar } = useSnackbar();
  const { projectId } = useProject();
  const pageInfo = usePageInformation(OpsPageNames.ProjectOperationManagement);
  const canEdit = !!(pageInfo?.hasEdit && pageInfo?.userCanEdit);
  const base = `/${locale}${Routes.Project}/${projectId}`;

  const [blocks, setBlocks] = useState<IBlockOption[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(true);
  const [blockId, setBlockId] = useState<number | null>(null);
  const [items, setItems] = useState<IWorkspaceItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | string | null>(null);
  const [projectUnits, setProjectUnits] = useState<IProjectUnit[]>([]);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number | null>(null);
  // Çalışma alanındaki blok filtresinin aynısı: kat ve mülk poligonları üst üste bindiğinde
  // numaralandırırken yalnız birini göstermek için. null = hepsi.
  const [polygonTypeFilter, setPolygonTypeFilter] = useState<number | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  // Bloğun çalışma alanına yazıyoruz; düzenleme yetkisi yoksa kilit de alınmaz.
  const workspaceLock = useWorkspaceLock({
    projectId,
    entityType: EntityTypeEnum.Block,
    entityId: canEdit ? blockId : null,
  });

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0] ?? null;
  const unitsById = useMemo(() => new Map(projectUnits.map((unit) => [unit.id, unit])), [projectUnits]);
  const polygonLabels = useMemo(
    () =>
      (selectedItem?.polygons ?? []).map((polygon, index) =>
        unitLabel(unitsById.get(Number(polygon.relatedEntityId)), t("Form.TagWithNnumber", { number: index + 1 }))
      ),
    [selectedItem?.polygons, unitsById, t]
  );
  const polygonTypeCounts = useMemo(() => {
    const polygons = selectedItem?.polygons ?? [];
    const count = (type: number) => polygons.filter((polygon) => Number(polygon.type ?? 0) === type).length;
    return { unit: count(PolygonTypeEnum.Unit), floor: count(PolygonTypeEnum.Floor), all: polygons.length };
  }, [selectedItem?.polygons]);

  // Seçili poligon filtreyle gizlenirse seçim (ve açık daire seçici) kapanır.
  useEffect(() => {
    const polygon = selectedPolygonIndex != null ? selectedItem?.polygons?.[selectedPolygonIndex] : null;
    if (polygon && !polygonMatchesTypeFilter(polygon, polygonTypeFilter)) setSelectedPolygonIndex(null);
  }, [polygonTypeFilter, selectedPolygonIndex, selectedItem?.polygons]);

  const selectedPolygon = selectedPolygonIndex != null ? selectedItem?.polygons?.[selectedPolygonIndex] ?? null : null;
  const selectedPolygonUnit = selectedPolygon ? unitsById.get(Number(selectedPolygon.relatedEntityId)) ?? null : null;

  useEffect(() => {
    setBlocksLoading(true);
    axiosInstance
      .patch(
        ApiRoutes.Lookups,
        {
          parameters: [
            {
              entityName: "Block",
              requestedPropertyNames: ["Name"],
              filtering: projectFilter(projectId),
              sorting: { sortBy: "Name", type: SortTypeEnum.Asc },
            },
          ],
        },
        { withoutToast: true }
      )
      .then((response) => {
        const rows = (response.data?.data?.[0]?.data ?? []) as Array<{ Id?: number; id?: number; Name?: string; name?: string }>;
        setBlocks(
          rows
            .map((row) => ({
              id: Number(row.Id ?? row.id),
              name: String(row.Name ?? row.name ?? "").trim() || `#${row.Id ?? row.id}`,
            }))
            .filter((row) => Number.isFinite(row.id) && row.id > 0)
        );
      })
      .catch(() => setBlocks([]))
      .finally(() => setBlocksLoading(false));
  }, [projectId]);

  useEffect(() => {
    fetchProjectUnits(projectId)
      .then(setProjectUnits)
      .catch(() => setProjectUnits([]));
  }, [projectId]);

  const loadImages = useCallback(
    async (selectedBlockId: number) => {
      setItemsLoading(true);
      setSelectedPolygonIndex(null);
      try {
        const response = await axiosInstance.get(ApiRoutes.Workspace, {
          params: { projectId, entityType: EntityTypeEnum.Block, entityId: selectedBlockId },
          withoutToast: true,
        });
        const workspace = (response.data?.data ?? null) as IWorkspace | null;
        const next = [...(workspace?.items ?? [])]
          .filter((item) => item.mainFrame)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setItems(next);
        setSelectedItemId(next[0]?.id ?? null);
      } catch {
        setItems([]);
        setSelectedItemId(null);
        enqueueSnackbar(t("Toast.Error"), { variant: "error" });
      } finally {
        setItemsLoading(false);
      }
    },
    [projectId, enqueueSnackbar, t]
  );

  const persistPolygons = async (polygons: ISvgPolygon[]) => {
    if (!selectedItem || !blockId) return;
    if (workspaceLock.readOnly) {
      enqueueSnackbar(t("Draw.WorkspaceLockedByOther"), { variant: "warning" });
      return;
    }
    setItems((prev) => prev.map((item) => (item.id === selectedItem.id ? { ...item, polygons } : item)));
    const response = await axiosInstance.put(
      ApiRoutes.WorkspaceItems,
      {
        entityId: blockId,
        entityType: EntityTypeEnum.Block,
        items: [
          {
            id: selectedItem.id,
            order: selectedItem.order,
            mainFrame: selectedItem.mainFrame,
            compassDegree: selectedItem.compassDegree,
            polygons,
          },
        ],
      },
      { withoutToast: true }
    );
    if (response.data?.isSuccess) enqueueSnackbar(t("Toast.Success"), { variant: "success" });
    else enqueueSnackbar(t("Toast.Error"), { variant: "error" });
  };

  const handleAssign = async (unit: IProjectUnit) => {
    if (!canEdit || !selectedItem || selectedPolygonIndex == null) return;
    const polygons = [...(selectedItem.polygons ?? [])];
    const current = polygons[selectedPolygonIndex];
    if (!current) return;
    polygons[selectedPolygonIndex] = assignUnitToPolygon(current, unit);
    await persistPolygons(polygons);
  };

  const handleClear = async () => {
    if (!canEdit || !selectedItem || selectedPolygonIndex == null) return;
    const polygons = [...(selectedItem.polygons ?? [])];
    const current = polygons[selectedPolygonIndex];
    if (!current) return;
    polygons[selectedPolygonIndex] = clearPolygonUnit(current);
    await persistPolygons(polygons);
  };

  return (
    <ProjectSection title={t("Project.UnitNumbers")}>
      <Alert severity="info" sx={{ mb: 2 }}>
        {t("Project.UnitNumbersHint")} {t("Project.ClickMarking")}
      </Alert>
      {workspaceLock.readOnly && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t("Draw.WorkspaceLockedByOther")}
        </Alert>
      )}

      {blocksLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : blocks.length === 0 ? (
        <Alert severity="warning">
          {t("Project.NoBlocks")}{" "}
          <Link href={`${base}/blocks`} style={{ fontWeight: 700 }}>
            {t("Form.Blocks")}
          </Link>
        </Alert>
      ) : (
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              {t("Form.Blocks")}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {blocks.map((block) => (
                <Chip
                  key={block.id}
                  label={block.name}
                  onClick={() => {
                    setBlockId(block.id);
                    void loadImages(block.id);
                  }}
                  color={block.id === blockId ? "primary" : "default"}
                  variant={block.id === blockId ? "filled" : "outlined"}
                  data-cy={`unit-number-block-${block.id}`}
                />
              ))}
            </Stack>
          </Box>

          {!blockId && <Alert severity="info">{t("Project.UnitNumbersSelectBlock")}</Alert>}

          {blockId && itemsLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {blockId && !itemsLoading && items.length === 0 && (
            <Alert severity="info">
              {t("Project.NoWorkspaceImages")}{" "}
              <Link href={`/${locale}/workspace/project/${projectId}`} style={{ fontWeight: 700 }}>
                {t("Form.Workspace")}
              </Link>
            </Alert>
          )}

          {selectedItem?.image?.url && (selectedItem.polygons?.length ?? 0) > 0 && (
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              value={polygonTypeFilter ?? "all"}
              onChange={(_, value) => {
                if (value == null) return;
                setPolygonTypeFilter(value === "all" ? null : Number(value));
              }}
              sx={{ alignSelf: "flex-start" }}
              data-cy="unit-number-type-filter"
            >
              <ToggleButton value={PolygonTypeEnum.Unit}>
                {t("EntityType.4")} ({polygonTypeCounts.unit})
              </ToggleButton>
              <ToggleButton value={PolygonTypeEnum.Floor}>
                {t("EntityType.3")} ({polygonTypeCounts.floor})
              </ToggleButton>
              <ToggleButton value="all">
                {t("Draw.ShowAll")} ({polygonTypeCounts.all})
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          {selectedItem?.image?.url && (
            <Box
              sx={{
                position: "relative",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "12px",
                overflow: "hidden",
                bgcolor: "background.default",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box sx={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
                <Box
                  component="img"
                  src={selectedItem.image.url}
                  alt={selectedItem.image.fileName ?? `#${selectedItem.id}`}
                  onLoad={(event) => {
                    const img = event.currentTarget;
                    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                  }}
                  sx={{ display: "block", maxWidth: "100%", maxHeight: "62vh", objectFit: "contain" }}
                />
                <PolygonOverlay
                  polygons={selectedItem.polygons}
                  labels={polygonLabels}
                  selectedIndex={selectedPolygonIndex}
                  naturalWidth={naturalSize.width}
                  naturalHeight={naturalSize.height}
                  onSelect={setSelectedPolygonIndex}
                  typeFilter={polygonTypeFilter}
                />
              </Box>
            </Box>
          )}

          {items.length > 1 && (
            <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1 }}>
              {items.map((item) => (
                <Box
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setSelectedPolygonIndex(null);
                    setNaturalSize({ width: 0, height: 0 });
                  }}
                  sx={{
                    width: 120,
                    height: 80,
                    flexShrink: 0,
                    borderRadius: "10px",
                    backgroundImage: item.image?.url ? `url(${item.image.url})` : undefined,
                    backgroundSize: "cover",
                    border: "3px solid",
                    borderColor: item.id === selectedItem?.id ? "primary.main" : "transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      )}

      <WorkspaceUnitPicker
        open={selectedPolygonIndex != null}
        units={projectUnits}
        current={selectedPolygonUnit}
        onClose={() => setSelectedPolygonIndex(null)}
        onSelect={(unit) => void handleAssign(unit)}
        onClear={canEdit ? () => void handleClear() : undefined}
      />
    </ProjectSection>
  );
}
