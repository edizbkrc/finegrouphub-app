"use client";

import { useTranslations } from "next-intl";
import { Box, FormControl, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import AsyncAutocomplete, { type IAutoSelectItem } from "@components/AsyncAutocomplete";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";
import { SortTypeEnum } from "@common/enums/SortTypeEnum";
import { EntityTypeEnum, type LookupOption } from "./EntityTypeEnum";

interface IProps {
  projectId: number;
  entityTypes: number[];
  entityType: number | "";
  selectedStage: LookupOption | null;
  selectedBlock: LookupOption | null;
  selectedFloor: LookupOption | null;
  selectedUnit: LookupOption | null;
  selectedDollhouse: LookupOption | null;
  selectedUnitTemplate: LookupOption | null;
  onEntityTypeChange: (type: number) => void;
  onStageChange: (value: LookupOption | null) => void;
  onBlockChange: (value: LookupOption | null) => void;
  onFloorChange: (value: LookupOption | null) => void;
  onUnitChange: (value: LookupOption | null) => void;
  onDollhouseChange: (value: LookupOption | null) => void;
  onUnitTemplateChange: (value: LookupOption | null) => void;
}

/** Filtre alanları production app bar ile aynı yükseklik/genişlik dilinde. */
const fieldSx = {
  minWidth: { xs: "100%", sm: 160 },
  flex: { xs: "1 1 100%", sm: "0 1 200px" },
  "& .MuiInputBase-root": { height: 40, bgcolor: "background.paper" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
  "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
};

/**
 * Production WorkspaceAppBar ile aynı kademeli filtre zinciri:
 * Panel Tipi → (Etap → Blok → Kat → Mülk) | Dollhouse | Mülk Şablonu
 */
export default function WorkspaceEntityFilters({
  projectId,
  entityTypes,
  entityType,
  selectedStage,
  selectedBlock,
  selectedFloor,
  selectedUnit,
  selectedDollhouse,
  selectedUnitTemplate,
  onEntityTypeChange,
  onStageChange,
  onBlockChange,
  onFloorChange,
  onUnitChange,
  onDollhouseChange,
  onUnitTemplateChange,
}: IProps) {
  const t = useTranslations();
  const type = typeof entityType === "number" ? entityType : null;

  const asOption = (value: unknown): LookupOption | null => {
    if (!value || typeof value !== "object") return null;
    const item = value as IAutoSelectItem;
    if (item.id == null) return null;
    return { id: item.id as number | string, title: item.title };
  };

  const showStage =
    type != null &&
    type > EntityTypeEnum.Project &&
    type !== EntityTypeEnum.Dollhouse &&
    type !== EntityTypeEnum.UnitTemplate &&
    type !== EntityTypeEnum.ProjectMinimap;

  const showBlock =
    type != null &&
    type > EntityTypeEnum.ProjectStage &&
    type !== EntityTypeEnum.Dollhouse &&
    type !== EntityTypeEnum.UnitTemplate &&
    type !== EntityTypeEnum.ProjectMinimap;

  const showFloor =
    type != null &&
    type > EntityTypeEnum.Block &&
    type !== EntityTypeEnum.Dollhouse &&
    type !== EntityTypeEnum.UnitTemplate &&
    type !== EntityTypeEnum.ProjectMinimap;

  const showUnit =
    type != null &&
    type > EntityTypeEnum.Floor &&
    type !== EntityTypeEnum.Dollhouse &&
    type !== EntityTypeEnum.UnitTemplate &&
    type !== EntityTypeEnum.ProjectMinimap;

  return (
    <Stack
      direction="row"
      spacing={1.5}
      flexWrap="wrap"
      useFlexGap
      alignItems="center"
      sx={{ width: "100%" }}
    >
      <FormControl size="small" sx={{ ...fieldSx, flex: { sm: "0 0 168px" } }}>
        <InputLabel id="workspace-panel-type">{t("Draw.PanelType")}</InputLabel>
        <Select
          labelId="workspace-panel-type"
          label={t("Draw.PanelType")}
          value={entityType}
          onChange={(e) => onEntityTypeChange(Number(e.target.value))}
          data-cy="workspace-panel-type"
        >
          {entityTypes.map((value) => (
            <MenuItem key={value} value={value}>
              {t(`EntityType.${value}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showStage && (
        <Box sx={fieldSx}>
          <AsyncAutocomplete
            key={`stage-${entityType}-${selectedStage?.id ?? "x"}`}
            label={t("EntityType.1")}
            defaultValue={selectedStage}
            onChange={(value) => onStageChange(asOption(value))}
            fullWidth
            autoCompleteProps={{
              lookUpParams: {
                entityName: "FineProjectStage",
                requestedPropertyNames: ["Name"],
                filtering: {
                  criterias: [{ filterBy: "ProjectId", value: projectId, type: FilterTypeEnum.EqualTo }],
                },
              },
            }}
          />
        </Box>
      )}

      {showBlock && (
        <Box sx={fieldSx}>
          <AsyncAutocomplete
            key={`block-${entityType}-${selectedStage?.id ?? "x"}`}
            label={t("EntityType.2")}
            defaultValue={selectedBlock}
            disabled={!selectedStage}
            onChange={(value) => onBlockChange(asOption(value))}
            fullWidth
            autoCompleteProps={{
              lookUpParams: {
                entityName: "Block",
                requestedPropertyNames: ["Name"],
                filtering: {
                  criterias: [
                    { filterBy: "ProjectStageId", value: Number(selectedStage?.id), type: FilterTypeEnum.EqualTo },
                    { filterBy: "ProjectId", value: projectId, type: FilterTypeEnum.EqualTo },
                  ],
                },
                sorting: { sortBy: "Name", type: SortTypeEnum.Asc },
              },
            }}
          />
        </Box>
      )}

      {showFloor && (
        <Box sx={fieldSx}>
          <AsyncAutocomplete
            key={`floor-${entityType}-${selectedBlock?.id ?? "x"}`}
            label={t("EntityType.3")}
            defaultValue={selectedFloor}
            disabled={!selectedBlock}
            onChange={(value) => onFloorChange(asOption(value))}
            fullWidth
            autoCompleteProps={{
              getOptions: (setLoading, setOptions) => {
                if (!selectedBlock?.id) {
                  setOptions([]);
                  return;
                }
                setLoading(true);
                axiosInstance
                  .patch(
                    ApiRoutes.Lookups,
                    {
                      parameters: [
                        {
                          entityName: "Floor",
                          requestedPropertyNames: ["Number"],
                          filtering: {
                            criterias: [
                              { filterBy: "BlockId", value: Number(selectedBlock.id), type: FilterTypeEnum.EqualTo },
                              { filterBy: "ProjectId", value: projectId, type: FilterTypeEnum.EqualTo },
                            ],
                          },
                          sorting: { sortBy: "Number", type: SortTypeEnum.Asc },
                        },
                      ],
                    },
                    { withoutToast: true }
                  )
                  .then((response) => {
                    if (response.data?.isSuccess) {
                      const rows = response?.data?.data?.[0]?.data || [];
                      setOptions(
                        rows.map((item: { Id: number; Number?: number }) => ({
                          id: item.Id,
                          title: t("Form.FloorWithNumber", { number: item?.Number?.toString() || "" }),
                        }))
                      );
                    }
                  })
                  .finally(() => setLoading(false));
              },
            }}
          />
        </Box>
      )}

      {showUnit && (
        <Box sx={{ ...fieldSx, flex: { sm: "0 1 220px" } }}>
          <AsyncAutocomplete
            key={`unit-${entityType}-${selectedFloor?.id ?? "x"}`}
            label={t("EntityType.4")}
            defaultValue={selectedUnit}
            disabled={!selectedFloor}
            onChange={(value) => onUnitChange(asOption(value))}
            fullWidth
            autoCompleteProps={{
              getOptions: (setLoading, setOptions) => {
                if (!selectedFloor?.id) {
                  setOptions([]);
                  return;
                }
                setLoading(true);
                axiosInstance
                  .patch(
                    ApiRoutes.Lookups,
                    {
                      parameters: [
                        {
                          entityName: "Unit",
                          requestedPropertyNames: ["UnitNumber"],
                          filtering: {
                            criterias: [
                              { filterBy: "FloorId", value: Number(selectedFloor.id), type: FilterTypeEnum.EqualTo },
                              { filterBy: "ProjectId", value: projectId, type: FilterTypeEnum.EqualTo },
                            ],
                          },
                          sorting: { sortBy: "UnitNumber", type: SortTypeEnum.Asc },
                        },
                      ],
                    },
                    { withoutToast: true }
                  )
                  .then((response) => {
                    if (response.data?.isSuccess) {
                      const rows = response?.data?.data?.[0]?.data || [];
                      setOptions(
                        rows.map((item: { Id: number; UnitNumber?: string }) => ({
                          id: item.Id,
                          title: t("Form.UnitWithNumber", { number: item?.UnitNumber?.toString() || "" }),
                        }))
                      );
                    }
                  })
                  .finally(() => setLoading(false));
              },
            }}
          />
        </Box>
      )}

      {type === EntityTypeEnum.Dollhouse && (
        <Box sx={{ ...fieldSx, flex: { sm: "0 1 220px" } }}>
          <AsyncAutocomplete
            key={`dollhouse-${entityType}`}
            label={t("EntityType.5")}
            defaultValue={selectedDollhouse}
            onChange={(value) => onDollhouseChange(asOption(value))}
            fullWidth
            autoCompleteProps={{
              getOptions: (setLoading, setOptions) => {
                setLoading(true);
                axiosInstance
                  .patch(
                    ApiRoutes.Lookups,
                    {
                      parameters: [
                        {
                          entityName: "UnitTemplate",
                          requestedPropertyNames: ["Name"],
                          filtering: {
                            criterias: [{ filterBy: "ProjectId", value: projectId, type: FilterTypeEnum.EqualTo }],
                          },
                        },
                      ],
                    },
                    { withoutToast: true }
                  )
                  .then((unitResponse) => {
                    const unitList = unitResponse.data?.isSuccess ? unitResponse?.data?.data?.[0]?.data || [] : [];
                    return axiosInstance
                      .patch(
                        ApiRoutes.Lookups,
                        {
                          parameters: [
                            {
                              entityName: "Dollhouse",
                              requestedPropertyNames: ["UnitTemplateId"],
                              filtering: {
                                criterias: [{ filterBy: "ProjectId", value: projectId, type: FilterTypeEnum.EqualTo }],
                              },
                            },
                          ],
                        },
                        { withoutToast: true }
                      )
                      .then((response) => {
                        if (response.data?.isSuccess) {
                          const rows = response?.data?.data?.[0]?.data || [];
                          setOptions(
                            rows.map((item: { Id: number; UnitTemplateId?: number }) => ({
                              id: item.Id,
                              title:
                                unitList.find((unit: { Id: number; Name?: string }) => unit?.Id === item?.UnitTemplateId)?.Name ||
                                t("Draw.Dollhouse"),
                            }))
                          );
                        }
                      });
                  })
                  .finally(() => setLoading(false));
              },
            }}
          />
        </Box>
      )}

      {type === EntityTypeEnum.UnitTemplate && (
        <Box sx={fieldSx}>
          <AsyncAutocomplete
            key={`unit-template-${entityType}`}
            label={t("EntityType.6")}
            defaultValue={selectedUnitTemplate}
            onChange={(value) => onUnitTemplateChange(asOption(value))}
            fullWidth
            autoCompleteProps={{
              lookUpParams: {
                entityName: "UnitTemplate",
                requestedPropertyNames: ["Name"],
                filtering: {
                  criterias: [{ filterBy: "ProjectId", value: projectId, type: FilterTypeEnum.EqualTo }],
                },
              },
            }}
          />
        </Box>
      )}
    </Stack>
  );
}
