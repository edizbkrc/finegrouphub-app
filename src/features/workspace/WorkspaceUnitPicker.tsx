"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type {
  IProjectUnit,
  IWorkspaceBlock,
  IWorkspaceInfoCard,
  IWorkspaceTour,
  IWorkspaceTourScene,
} from "./projectUnits";
import {
  blockLabel,
  blockMatches,
  fetchVirtualTourScenes,
  infoCardLabel,
  infoCardMatches,
  sceneLabel,
  tourLabel,
  unitLabel,
  unitMatches,
  updateProjectUnitFields,
} from "./projectUnits";
import { EntityTypeEnum } from "./EntityTypeEnum";

/** Etap: Boş | Proje | Blok | Bilgi Kartı | Sanal Tur | Url */
type NavBindKind = "none" | "project" | "block" | "infoCard" | "tour" | "url";

/**
 * İşarete tıklanınca açılan etiket menüsü (bind) veya
 * "Daire Düzenleme" ile doğrudan ad/numara düzenleme (edit).
 */
export default function WorkspaceUnitPicker({
  open,
  mode = "bind",
  units,
  current,
  tours = [],
  currentTour = null,
  currentSceneId = null,
  infoCards = [],
  currentInfoCard = null,
  currentUrl = null,
  blocks = [],
  currentBlock = null,
  currentNavKind = null,
  projectId = 0,
  entityType = EntityTypeEnum.Project,
  entityId = projectId,
  allowUnits = true,
  allowTours = false,
  allowInfoCards = false,
  allowUrl = false,
  allowBlocks = false,
  allowProject = false,
  allowNone = false,
  presentationType = 1,
  onClose,
  onSelect,
  onSelectTour,
  onSelectInfoCard,
  onSelectUrl,
  onSelectBlock,
  onSelectProject,
  onClear,
  onUnitUpdated,
}: {
  open: boolean;
  mode?: "bind" | "edit";
  units: IProjectUnit[];
  current: IProjectUnit | null;
  tours?: IWorkspaceTour[];
  currentTour?: IWorkspaceTour | null;
  currentSceneId?: string | null;
  infoCards?: IWorkspaceInfoCard[];
  currentInfoCard?: IWorkspaceInfoCard | null;
  currentUrl?: string | null;
  blocks?: IWorkspaceBlock[];
  currentBlock?: IWorkspaceBlock | null;
  /** Mevcut poligonun navigasyon tipi (select başlangıcı). */
  currentNavKind?: NavBindKind | null;
  projectId?: number;
  entityType?: number | "";
  entityId?: number | "";
  allowUnits?: boolean;
  allowTours?: boolean;
  allowInfoCards?: boolean;
  allowUrl?: boolean;
  allowBlocks?: boolean;
  allowProject?: boolean;
  allowNone?: boolean;
  presentationType?: number | null;
  onClose: () => void;
  onSelect?: (unit: IProjectUnit) => void;
  onSelectTour?: (tour: IWorkspaceTour, sceneId: string) => void;
  onSelectInfoCard?: (card: IWorkspaceInfoCard) => void;
  onSelectUrl?: (url: string) => void;
  onSelectBlock?: (block: IWorkspaceBlock) => void;
  onSelectProject?: () => void;
  onClear?: () => void;
  onUnitUpdated?: (unit: IProjectUnit) => void;
}) {
  const t = useTranslations();
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editUnitNumber, setEditUnitNumber] = useState("");
  const [savingUnit, setSavingUnit] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [focusedUnit, setFocusedUnit] = useState<IProjectUnit | null>(null);
  const [navKind, setNavKind] = useState<NavBindKind>("none");
  const [draftTourId, setDraftTourId] = useState("");
  const [draftSceneId, setDraftSceneId] = useState("");
  const [scenes, setScenes] = useState<IWorkspaceTourScene[]>([]);
  const [loadingScenes, setLoadingScenes] = useState(false);

  const isEditMode = mode === "edit";
  const showUnits = isEditMode || allowUnits;
  const navOptionCount =
    Number(allowNone) +
    Number(allowProject) +
    Number(allowBlocks) +
    Number(allowInfoCards) +
    Number(allowTours) +
    Number(allowUrl);
  const useNavSelect =
    !isEditMode && !showUnits && navOptionCount > 0 && (allowTours || allowInfoCards || allowUrl || allowBlocks || allowProject || allowNone);
  const showNavKindSelect = useNavSelect && navOptionCount > 1;
  const activeUnit = isEditMode ? focusedUnit : current;

  const seedEditFields = (unit: IProjectUnit | null | undefined) => {
    const tags = unit?.tags ?? "";
    const number = unit?.unitNumber ?? "";
    setEditTags(tags || number);
    setEditUnitNumber(number || tags);
  };

  const defaultNavKind = (): NavBindKind => {
    if (currentNavKind) return currentNavKind;
    if (currentInfoCard && allowInfoCards) return "infoCard";
    if (currentUrl && allowUrl) return "url";
    if (currentTour && allowTours) return "tour";
    if (currentBlock && allowBlocks) return "block";
    if (allowTours) return "tour";
    if (allowInfoCards) return "infoCard";
    if (allowUrl) return "url";
    if (allowBlocks) return "block";
    if (allowProject) return "project";
    if (allowNone) return "none";
    return "none";
  };

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setUrlDraft(currentUrl ?? "");
    setDraftTourId(currentTour?.id ?? "");
    setDraftSceneId(currentSceneId ?? "");
    setNavKind(defaultNavKind());
    if (isEditMode) {
      setFocusedUnit(current);
      seedEditFields(current);
    } else {
      seedEditFields(current);
    }
  }, [
    open,
    isEditMode,
    current?.id,
    current?.tags,
    current?.unitNumber,
    currentTour?.id,
    currentSceneId,
    currentInfoCard?.id,
    currentUrl,
    currentBlock?.id,
    currentNavKind,
    allowTours,
    allowInfoCards,
    allowUrl,
    allowBlocks,
    allowProject,
    allowNone,
  ]);

  useEffect(() => {
    if (!open || !draftTourId || !projectId) {
      setScenes([]);
      return;
    }
    let cancelled = false;
    setLoadingScenes(true);
    fetchVirtualTourScenes(projectId, draftTourId, entityType, entityId)
      .then((rows) => {
        if (!cancelled) setScenes(rows);
      })
      .catch(() => {
        if (!cancelled) setScenes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingScenes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, draftTourId, projectId, entityType, entityId]);

  useEffect(() => {
    if (!isEditMode || !open) return;
    seedEditFields(focusedUnit);
  }, [isEditMode, open, focusedUnit?.id, focusedUnit?.tags, focusedUnit?.unitNumber]);

  const filtered = useMemo(() => units.filter((unit) => unitMatches(unit, query)), [units, query]);
  const filteredInfoCards = useMemo(
    () => infoCards.filter((card) => infoCardMatches(card, query)),
    [infoCards, query]
  );
  const filteredBlocks = useMemo(() => blocks.filter((block) => blockMatches(block, query)), [blocks, query]);

  const showTours = useNavSelect ? navKind === "tour" && allowTours : !isEditMode && allowTours && !allowUnits;
  const showInfoCards = useNavSelect ? navKind === "infoCard" && allowInfoCards : !isEditMode && allowInfoCards;
  const showUrl = useNavSelect && navKind === "url" && allowUrl;
  const showBlocks = useNavSelect ? navKind === "block" && allowBlocks : !isEditMode && allowBlocks && !useNavSelect;
  const showProject = useNavSelect && navKind === "project" && allowProject;
  const showNone = useNavSelect && navKind === "none" && allowNone;

  const draftTour = tours.find((tour) => tour.id === draftTourId) ?? null;
  const draftScene = scenes.find((scene) => scene.id === draftSceneId) ?? null;
  const tourBindDirty =
    Boolean(draftTourId && draftSceneId) &&
    (draftTourId !== (currentTour?.id ?? "") || draftSceneId !== (currentSceneId ?? ""));

  const title = isEditMode
    ? t("Project.EditUnits")
    : useNavSelect
      ? t("Form.NavigationType")
      : showBlocks
        ? t("Form.Blocks")
        : allowTours && !allowUnits
          ? t("Form.VirtualTours")
          : t("Form.UnitDetails");

  const hint = isEditMode
    ? t("Project.EditUnitsHint")
    : useNavSelect
      ? t("Project.PickNavType")
      : showBlocks
        ? t("Project.PickExistingBlock")
        : allowTours && !allowUnits
          ? t("Project.PickExistingTour")
          : t("Project.PickExistingUnit");

  const searchPlaceholder =
    isEditMode || showUnits
      ? t("Project.SearchUnits")
      : showBlocks
        ? t("Project.SearchBlocks")
        : showInfoCards
          ? t("Project.SearchInfoCards")
          : t("Project.SearchTours");

  // Önizleme geceyse tur da gece panoramasıyla açılır (frame nightImage + VT nightImage).
  const nightHint =
    presentationType === 2
      ? t("Project.TourOpensInNight")
      : presentationType === 3
        ? t("Project.TourOpensInMixed")
        : t("Project.TourOpensInDay");

  const unitDirty =
    Boolean(activeUnit) &&
    (editTags.trim() !== (activeUnit?.tags ?? "").trim() ||
      editUnitNumber.trim() !== (activeUnit?.unitNumber ?? "").trim());

  const urlDirty = urlDraft.trim() !== (currentUrl ?? "").trim();
  const urlValid = /^https?:\/\//i.test(urlDraft.trim());

  const handleSaveUnitFields = async () => {
    if (!activeUnit || !unitDirty) return;
    setSavingUnit(true);
    try {
      const nextNumber = editUnitNumber.trim() || editTags.trim();
      const nextTags = editTags.trim() || nextNumber;
      const updated = await updateProjectUnitFields(activeUnit, {
        tags: nextTags,
        unitNumber: nextNumber,
      });
      if (isEditMode) setFocusedUnit(updated);
      onUnitUpdated?.(updated);
      setEditTags(nextTags);
      setEditUnitNumber(nextNumber);
      enqueueSnackbar(t("Toast.Success"), { variant: "success" });
    } catch {
      enqueueSnackbar(t("Toast.Error"), { variant: "error" });
    } finally {
      setSavingUnit(false);
    }
  };

  const handlePickUnit = (unit: IProjectUnit) => {
    if (isEditMode) {
      setFocusedUnit(unit);
      return;
    }
    onSelect?.(unit);
  };

  const handleSaveUrl = () => {
    const value = urlDraft.trim();
    if (!urlValid) {
      enqueueSnackbar(t("Project.InvalidUrl"), { variant: "warning" });
      return;
    }
    onSelectUrl?.(value);
  };

  const handleSaveTour = () => {
    if (!draftTour || !draftSceneId) {
      enqueueSnackbar(t("Project.PickTourAndScene"), { variant: "warning" });
      return;
    }
    onSelectTour?.(draftTour, draftSceneId);
  };

  const currentBindingLabel = (() => {
    if (currentBlock) return blockLabel(currentBlock, "—");
    if (currentInfoCard) return infoCardLabel(currentInfoCard, "—");
    if (currentTour) {
      const sceneName = draftSceneId && currentTour.id === draftTourId ? draftScene?.name : null;
      return sceneName ? `${tourLabel(currentTour, "—")} · ${sceneName}` : tourLabel(currentTour, "—");
    }
    if (currentUrl) return currentUrl;
    if (currentNavKind === "project") return t("NavigationType.Project");
    if (current) return unitLabel(current, "—");
    return null;
  })();

  const currentBindingType = currentInfoCard
    ? t("NavigationType.InfoCard")
    : currentTour
      ? `${t("NavigationType.VirtualTour")} · ${t(`PresentationType.${presentationType === 2 ? 2 : presentationType === 3 ? 3 : 1}`)}`
      : currentUrl
        ? t("NavigationType.Url")
        : currentBlock
          ? t("NavigationType.Block")
          : currentNavKind === "project"
            ? t("NavigationType.Project")
            : null;

  const hasBinding = Boolean(current || currentTour || currentInfoCard || currentUrl || currentBlock || currentNavKind === "project");

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          p: 2,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, flexShrink: 0 }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} aria-label={t("Button.Close")}>
          <CloseIcon />
        </IconButton>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexShrink: 0 }}>
        {hint}
      </Typography>

      {!isEditMode && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: "10px", bgcolor: "action.hover", flexShrink: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {t("Form.Tags")}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              wordBreak: "break-all",
              fontFamily: current && !currentTour && !currentInfoCard && !currentUrl && !currentBlock ? "monospace" : undefined,
            }}
          >
            {currentBindingLabel ?? t("NavigationType.None")}
          </Typography>
          {currentBindingType && (
            <Typography variant="body2" color="text.secondary">
              {currentBindingType}
            </Typography>
          )}
        </Box>
      )}

      {showNavKindSelect && (
        <FormControl fullWidth size="small" sx={{ mb: 2, flexShrink: 0 }}>
          <InputLabel id="workspace-nav-kind">{t("Form.NavigationType")}</InputLabel>
          <Select
            labelId="workspace-nav-kind"
            label={t("Form.NavigationType")}
            value={navKind}
            onChange={(event) => {
              setNavKind(event.target.value as NavBindKind);
              setQuery("");
            }}
            data-cy="workspace-nav-kind"
          >
            {allowNone && <MenuItem value="none">{t("NavigationType.None")}</MenuItem>}
            {allowProject && <MenuItem value="project">{t("NavigationType.Project")}</MenuItem>}
            {allowBlocks && <MenuItem value="block">{t("NavigationType.Block")}</MenuItem>}
            {allowInfoCards && <MenuItem value="infoCard">{t("NavigationType.InfoCard")}</MenuItem>}
            {allowTours && <MenuItem value="tour">{t("NavigationType.VirtualTour")}</MenuItem>}
            {allowUrl && <MenuItem value="url">{t("NavigationType.Url")}</MenuItem>}
          </Select>
        </FormControl>
      )}

      {showTours && (
        <Alert severity="info" sx={{ mb: 2, flexShrink: 0 }}>
          {nightHint}
        </Alert>
      )}

      {showUnits && activeUnit && (
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          {!isEditMode && (
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
              {t("Modal.EditUnit")}
            </Typography>
          )}
          <TextField
            size="small"
            fullWidth
            label={t("Project.UnitDisplayName")}
            value={editTags}
            onChange={(event) => setEditTags(event.target.value)}
            helperText={t("Project.UnitDisplayNameHint")}
            sx={{ mb: 1.5 }}
            inputProps={{ maxLength: 500, "data-cy": "workspace-unit-tags" }}
          />
          <TextField
            size="small"
            fullWidth
            label={t("Form.UnitNumber")}
            value={editUnitNumber}
            onChange={(event) => setEditUnitNumber(event.target.value)}
            sx={{ mb: 1.5 }}
            inputProps={{ maxLength: 50, "data-cy": "workspace-unit-number" }}
          />
          <Button
            variant="contained"
            fullWidth
            disabled={!unitDirty || savingUnit}
            onClick={() => void handleSaveUnitFields()}
            startIcon={savingUnit ? <CircularProgress size={16} color="inherit" /> : undefined}
            data-cy="workspace-unit-save-fields"
          >
            {t("Button.Save")}
          </Button>
          <Divider sx={{ my: 2 }} />
        </Box>
      )}

      {isEditMode && !activeUnit && (
        <Alert severity="info" sx={{ mb: 2, flexShrink: 0 }}>
          {t("Project.EditUnitsPickFirst")}
        </Alert>
      )}

      {showNone && (
        <Stack spacing={1.5} sx={{ flexShrink: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {t("Project.ClearNavHint")}
          </Typography>
          <Button variant="contained" fullWidth onClick={() => onClear?.()} data-cy="workspace-nav-none">
            {t("Project.ClearUnit")}
          </Button>
        </Stack>
      )}

      {showProject && (
        <Stack spacing={1.5} sx={{ flexShrink: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {t("Project.BindToProjectHint")}
          </Typography>
          <Button variant="contained" fullWidth onClick={() => onSelectProject?.()} data-cy="workspace-nav-project">
            {t("Button.Save")}
          </Button>
        </Stack>
      )}

      {showTours && (
        <Stack spacing={1.5} sx={{ mb: 2, flexShrink: 0 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="workspace-tour-select">{t("NavigationType.VirtualTour")}</InputLabel>
            <Select
              labelId="workspace-tour-select"
              label={t("NavigationType.VirtualTour")}
              value={draftTourId}
              displayEmpty
              onChange={(event) => {
                setDraftTourId(String(event.target.value));
                setDraftSceneId("");
              }}
              data-cy="workspace-tour-select"
            >
              <MenuItem value="">
                <em>{tours.length === 0 ? t("Project.NoTours") : t("Project.SelectTour")}</em>
              </MenuItem>
              {tours.map((tour) => (
                <MenuItem key={tour.id} value={tour.id}>
                  {tourLabel(tour, `#${tour.id}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" disabled={!draftTourId || loadingScenes}>
            <InputLabel id="workspace-scene-select">{t("Form.Scene")}</InputLabel>
            <Select
              labelId="workspace-scene-select"
              label={t("Form.Scene")}
              value={draftSceneId}
              displayEmpty
              onChange={(event) => setDraftSceneId(String(event.target.value))}
              data-cy="workspace-scene-select"
            >
              <MenuItem value="">
                <em>
                  {loadingScenes
                    ? "…"
                    : !draftTourId
                      ? t("Project.SelectTourFirst")
                      : scenes.length === 0
                        ? t("Project.NoScenes")
                        : t("Project.SelectScene")}
                </em>
              </MenuItem>
              {scenes.map((scene) => (
                <MenuItem key={scene.id} value={scene.id}>
                  {sceneLabel(scene, `#${scene.id}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            fullWidth
            disabled={!tourBindDirty}
            onClick={handleSaveTour}
            startIcon={loadingScenes ? <CircularProgress size={16} color="inherit" /> : undefined}
            data-cy="workspace-tour-save"
          >
            {t("Button.Save")}
          </Button>
        </Stack>
      )}

      {showUrl && (
        <Stack spacing={1.5} sx={{ flexShrink: 0 }}>
          <TextField
            size="small"
            fullWidth
            label={t("NavigationType.Url")}
            placeholder="https://"
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            inputProps={{ "data-cy": "workspace-nav-url" }}
          />
          <Button
            variant="contained"
            fullWidth
            disabled={!urlDirty || !urlDraft.trim()}
            onClick={handleSaveUrl}
            data-cy="workspace-nav-url-save"
          >
            {t("Button.Save")}
          </Button>
        </Stack>
      )}

      {!showUrl && !showTours && !showNone && !showProject && (showUnits || showBlocks || showInfoCards) && (
        <TextField
          size="small"
          fullWidth
          autoFocus={!activeUnit && !useNavSelect}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          sx={{ mb: 1, flexShrink: 0 }}
          inputProps={{ "data-cy": "workspace-unit-search" }}
        />
      )}

      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", mx: -1 }}>
        {showBlocks && (
          <List dense data-cy="workspace-block-list">
            {filteredBlocks.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                {t("Project.NoBlocks")}
              </Typography>
            ) : (
              filteredBlocks.map((block) => {
                const selected = currentBlock?.id === block.id;
                return (
                  <ListItemButton
                    key={block.id}
                    selected={selected}
                    onClick={() => onSelectBlock?.(block)}
                    data-cy={`workspace-block-${block.id}`}
                  >
                    <ListItemText
                      primary={blockLabel(block, `#${block.id}`)}
                      secondary={t("EntityType.2")}
                      primaryTypographyProps={{ fontWeight: 700 }}
                    />
                  </ListItemButton>
                );
              })
            )}
          </List>
        )}

        {showInfoCards && (
          <List dense data-cy="workspace-infocard-list">
            {filteredInfoCards.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                {t("Project.NoInfoCards")}
              </Typography>
            ) : (
              filteredInfoCards.map((card) => {
                const selected = currentInfoCard?.id === card.id;
                return (
                  <ListItemButton
                    key={card.id}
                    selected={selected}
                    onClick={() => onSelectInfoCard?.(card)}
                    data-cy={`workspace-infocard-${card.id}`}
                  >
                    <ListItemText
                      primary={infoCardLabel(card, `#${card.id}`)}
                      secondary={t("NavigationType.InfoCard")}
                      primaryTypographyProps={{ fontWeight: 700 }}
                    />
                  </ListItemButton>
                );
              })
            )}
          </List>
        )}

        {showUnits && (
          <List dense data-cy="workspace-unit-list">
            {filtered.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                {t("Project.NoUnits")}
              </Typography>
            ) : (
              filtered.map((unit) => {
                const selected = activeUnit?.id === unit.id;
                return (
                  <ListItemButton
                    key={unit.id}
                    selected={selected}
                    onClick={() => handlePickUnit(unit)}
                    data-cy={`workspace-unit-${unit.id}`}
                  >
                    <ListItemText
                      primary={unitLabel(unit, `#${unit.id}`)}
                      secondary={`${unit.blockName ? `${unit.blockName} · ` : ""}${t("Project.FloorNumber", { number: unit.floorNumber })} · ${unit.unitNumber || "—"}`}
                      primaryTypographyProps={{ fontFamily: "monospace", fontWeight: 700 }}
                    />
                  </ListItemButton>
                );
              })
            )}
          </List>
        )}
      </Box>

      {!isEditMode && hasBinding && onClear && !showNone && (
        <Button color="tertiary" onClick={onClear} sx={{ mt: 1, flexShrink: 0 }}>
          {t("Project.ClearUnit")}
        </Button>
      )}
    </Drawer>
  );
}
