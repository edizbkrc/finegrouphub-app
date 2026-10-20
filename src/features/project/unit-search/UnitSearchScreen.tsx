"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import { Routes } from "@enums/Routes";
import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";
import { SortTypeEnum } from "@common/enums/SortTypeEnum";
import { useProject } from "@/features/project/ProjectContext";
import ProjectSection from "@/features/project/ProjectSection";
import UnitSearchRangeFilter from "./UnitSearchRangeFilter";
import {
  applyFilters,
  asUnit,
  clearFilters,
  countActiveFilters,
  countMissing,
  facadeOptions,
  INITIAL_FILTERS,
  rangeBounds,
  roomOptions,
  type RangeBounds,
  type RangeKey,
  type RangeValue,
  type UnitSearchFilterState,
  type UnitSearchRow,
} from "./unitSearchFilters";

export type { UnitSearchRow } from "./unitSearchFilters";

function unitTitle(unit: UnitSearchRow): string {
  return unit.tags || unit.unitNumber || `#${unit.id}`;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

const RANGE_KEYS: RangeKey[] = ["floor", "netArea", "grossArea", "price"];

/**
 * Proje dairelerini listeler: etiket (A2D2) kartın başlığıdır.
 * Metin aramasına ek olarak tip (3+1), satış durumu ve giriş hızlı chip'lerle; oda sayısı, kat,
 * net/brüt m², cephe ve fiyat katlanabilir "Filtreler" bölümünde süzülür (mantık unitSearchFilters.ts).
 */
export default function UnitSearchScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const { projectId } = useProject();
  const [filters, setFilters] = useState<UnitSearchFilterState>(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [units, setUnits] = useState<UnitSearchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<UnitSearchFilterState>) => setFilters((previous) => ({ ...previous, ...patch }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const collected: UnitSearchRow[] = [];
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
        } while (page <= totalPages && !cancelled);
        if (!cancelled) setUnits(collected);
      } catch {
        if (!cancelled) {
          setError(t("UnitSearch.SearchError"));
          setUnits([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, t]);

  const typeOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const unit of units) {
      if (unit.unitTypeId > 0 && unit.unitTypeName && unit.unitTypeName !== "-") map.set(unit.unitTypeId, unit.unitTypeName);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [units]);

  const stateOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const unit of units) {
      if (unit.currentStateId && unit.currentStateName && unit.currentStateName !== "-") map.set(unit.currentStateId, unit.currentStateName);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [units]);

  const entranceOptions = useMemo(() => {
    const names = new Set<string>();
    for (const unit of units) {
      if (unit.entrance) names.add(unit.entrance);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "tr"));
  }, [units]);

  const rooms = useMemo(() => roomOptions(units), [units]);
  const facades = useMemo(() => facadeOptions(units), [units]);

  // Uçlar süzülmüş değil TÜM dairelerden: başka filtre değişince slider'lar zıplamasın.
  const ranges = useMemo(
    () =>
      RANGE_KEYS.map((key) => ({ key, bounds: rangeBounds(units, key), missing: countMissing(units, key) })).filter(
        (range): range is { key: RangeKey; bounds: RangeBounds; missing: number } => range.bounds != null
      ),
    [units]
  );

  const filtered = useMemo(() => applyFilters(units, filters), [units, filters]);
  const activeCount = countActiveFilters(filters);
  const formatNumber = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 2 });

  const rangeLabel = (key: RangeKey): string => {
    switch (key) {
      case "floor":
        return t("Form.Floor");
      case "netArea":
        return `${t("Form.NetArea")} (m²)`;
      case "grossArea":
        return `${t("Form.GrossArea")} (m²)`;
      case "price":
        return t("Form.Price");
    }
  };

  return (
    <ProjectSection title={t("Form.AdvancedUnitSearch")}>
      <Card variant="outlined" sx={{ borderRadius: "12px" }}>
        <CardContent>
          <TextField
            fullWidth
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder={t("UnitSearch.SearchPlaceholder")}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              },
            }}
            sx={{ mb: 2 }}
            data-cy="unit-search-input"
          />

          {typeOptions.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 0.75 }}>
                {t("Form.UnitType")}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  label={t("UnitSearch.AllTypes")}
                  color={filters.typeId == null ? "primary" : "default"}
                  variant={filters.typeId == null ? "filled" : "outlined"}
                  onClick={() => update({ typeId: null })}
                />
                {typeOptions.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.name}
                    color={filters.typeId === option.id ? "primary" : "default"}
                    variant={filters.typeId === option.id ? "filled" : "outlined"}
                    onClick={() => update({ typeId: filters.typeId === option.id ? null : option.id })}
                    data-cy={`unit-search-type-${option.id}`}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {stateOptions.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 0.75 }}>
                {t("Form.CurrentState")}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  label={t("UnitSearch.AllStates")}
                  color={filters.stateId == null ? "primary" : "default"}
                  variant={filters.stateId == null ? "filled" : "outlined"}
                  onClick={() => update({ stateId: null })}
                />
                {stateOptions.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.name}
                    color={filters.stateId === option.id ? "primary" : "default"}
                    variant={filters.stateId === option.id ? "filled" : "outlined"}
                    onClick={() => update({ stateId: filters.stateId === option.id ? null : option.id })}
                    data-cy={`unit-search-state-${option.id}`}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {entranceOptions.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 0.75 }}>
                {t("Form.Entrance")}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  label={t("UnitSearch.AllEntrances")}
                  color={filters.entrance == null ? "primary" : "default"}
                  variant={filters.entrance == null ? "filled" : "outlined"}
                  onClick={() => update({ entrance: null })}
                />
                {entranceOptions.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    color={filters.entrance === name ? "primary" : "default"}
                    variant={filters.entrance === name ? "filled" : "outlined"}
                    onClick={() => update({ entrance: filters.entrance === name ? null : name })}
                    data-cy={`unit-search-entrance-${name}`}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {units.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" justifyContent="space-between">
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                  aria-controls="unit-search-filters"
                  startIcon={
                    <Badge badgeContent={activeCount} color="primary">
                      <TuneIcon />
                    </Badge>
                  }
                  endIcon={<ExpandMoreIcon sx={{ transition: "transform .2s ease", transform: filtersOpen ? "rotate(180deg)" : "none" }} />}
                  sx={{ borderRadius: "10px", borderColor: "divider", textTransform: "none", fontWeight: 700 }}
                  data-cy="unit-search-filters-toggle"
                >
                  {t("UnitSearch.Filters")}
                </Button>
                {activeCount > 0 && (
                  <Button
                    size="small"
                    onClick={() => setFilters(clearFilters)}
                    startIcon={<FilterAltOffIcon />}
                    sx={{ textTransform: "none" }}
                    data-cy="unit-search-filters-clear"
                  >
                    {t("UnitSearch.ClearFilters")}
                  </Button>
                )}
              </Stack>

              <Collapse in={filtersOpen}>
                <Box
                  id="unit-search-filters"
                  sx={{ mt: 1.5, p: { xs: 1.5, sm: 2 }, border: "1px solid", borderColor: "divider", borderRadius: "12px" }}
                >
                  <Stack spacing={2.5}>
                    {rooms.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 0.75 }}>
                          {t("UnitSearch.RoomCount")}
                        </Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {rooms.map((room) => {
                            const selected = filters.rooms.includes(room);
                            return (
                              <Chip
                                key={room}
                                label={room}
                                color={selected ? "primary" : "default"}
                                variant={selected ? "filled" : "outlined"}
                                onClick={() => update({ rooms: toggle(filters.rooms, room) })}
                                data-cy={`unit-search-room-${room}`}
                              />
                            );
                          })}
                        </Stack>
                      </Box>
                    )}

                    {ranges.length > 0 && (
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: 2.5 }}>
                        {ranges.map(({ key, bounds, missing }) => (
                          <UnitSearchRangeFilter
                            key={key}
                            label={rangeLabel(key)}
                            bounds={bounds}
                            value={filters[key]}
                            onChange={(value: RangeValue) => update({ [key]: value } as Partial<UnitSearchFilterState>)}
                            missingCount={missing}
                            dataCy={`unit-search-range-${key}`}
                          />
                        ))}
                      </Box>
                    )}

                    {facades.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 0.75 }}>
                          {t("Form.Facades")}
                        </Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {facades.map((facade) => {
                            const selected = filters.facades.includes(facade);
                            return (
                              <Chip
                                key={facade}
                                label={t(`Facades.${facade}`)}
                                color={selected ? "primary" : "default"}
                                variant={selected ? "filled" : "outlined"}
                                onClick={() => update({ facades: toggle(filters.facades, facade) })}
                                data-cy={`unit-search-facade-${facade}`}
                              />
                            );
                          })}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Collapse>
            </Box>
          )}

          {loading && (
            <Stack alignItems="center" py={4}>
              <CircularProgress size={28} />
            </Stack>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t("UnitSearch.ResultCount", { count: filtered.length })}
            </Typography>
          )}

          {!loading && !error && filtered.length === 0 && (
            <Alert severity="info">{units.length === 0 ? t("UnitSearch.NoUnits") : t("UnitSearch.NoResults")}</Alert>
          )}

          {!loading && filtered.length > 0 && (
            <Stack spacing={1.5}>
              {filtered.map((unit) => (
                <Box
                  key={unit.id}
                  component={Link}
                  href={`/${locale}${Routes.Project}/${projectId}/units/search/unit/${unit.id}`}
                  sx={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "12px",
                    p: 2,
                    transition: "border-color .15s ease, background-color .15s ease",
                    "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                  }}
                  data-cy={`unit-search-row-${unit.id}`}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontFamily: "monospace", fontWeight: 800, letterSpacing: "-0.02em" }}>
                        {unitTitle(unit)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        {[
                          unit.unitTypeName,
                          unit.grossArea ? t("Form.GrossAreaM2", { count: unit.grossArea }) : null,
                          unit.netArea ? t("Form.NetAreaM2", { count: unit.netArea }) : null,
                          unit.price != null ? `${t("Form.Price")}: ${formatNumber(unit.price)}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {[
                          unit.blockName ? `${unit.blockName} ${t("Form.Block")}` : null,
                          t("Project.FloorNumber", { number: unit.floorNumber }),
                          unit.entrance ? `${t("Form.Entrance")} ${unit.entrance}` : null,
                          unit.stageName,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Typography>
                      {unit.facades.some((facade) => facades.includes(facade)) && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                          {`${t("Form.Facades")}: ${unit.facades
                            .filter((facade) => facades.includes(facade))
                            .map((facade) => t(`Facades.${facade}`))
                            .join(", ")}`}
                        </Typography>
                      )}
                    </Box>
                    {unit.currentStateName && <Chip size="small" label={unit.currentStateName} />}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </ProjectSection>
  );
}
