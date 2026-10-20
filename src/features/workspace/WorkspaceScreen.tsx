"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import JSONbig from "json-bigint";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DataObjectOutlinedIcon from "@mui/icons-material/DataObjectOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import ContrastIcon from "@mui/icons-material/Contrast";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import { Routes } from "@enums/Routes";
import OpsPageFormDeleteDialog from "@common/page/OpsPageFormDeleteDialog";
import DrawEditorDialog from "./DrawEditorDialog";
import PolygonOverlay from "./PolygonOverlay";
import WorkspaceJsonDrawer from "./WorkspaceJsonDrawer";
import WorkspaceHelpDialog from "./WorkspaceHelpDialog";
import WorkspaceUnitPicker from "./WorkspaceUnitPicker";
import {
  assignBlockToPolygon,
  assignInfoCardToPolygon,
  assignProjectToPolygon,
  assignTourToPolygon,
  assignUnitToPolygon,
  assignUrlToPolygon,
  clearPolygonUnit,
  entityAllowsBlock,
  entityAllowsInfoCard,
  entityAllowsUnit,
  entityAllowsVirtualTour,
  polygonHasProject,
  fetchBlockFloors,
  fetchProjectBlocks,
  fetchProjectInfoCards,
  fetchProjectUnits,
  fetchWorkspaceTours,
  polygonDisplayLabel,
  polygonHasInfoCard,
  polygonHasUrl,
  polygonHasVirtualTour,
  polygonMatchesTypeFilter,
  type IProjectUnit,
  type IWorkspaceBlock,
  type IWorkspaceFloor,
  type IWorkspaceInfoCard,
  type IWorkspaceTour,
} from "./projectUnits";
import { createWorkspaceItemsWithImages, replaceWorkspaceItemImage } from "./uploadWorkspaceImages";
import { useWorkspaceLock } from "./useWorkspaceLock";
import WorkspaceEntityFilters from "./WorkspaceEntityFilters";
import { EntityTypeEnum, type LookupOption } from "./EntityTypeEnum";
import { PolygonTypeEnum } from "./PolygonTypeEnum";
import type { ILookupOption, ISvgPolygon, IWorkspace, IWorkspaceItem } from "./types";
import {
  isWorkspaceEntityType,
  optionFromQuery,
  updateWorkspaceQueryParams,
  workspaceQueryToParams,
} from "./workspaceQueryHelpers";

/** API sayı veya {id} nesnesi dönebiliyor; ikon seçimi sayı kimliğine bakmalı. */
function presentationTypeId(type: number | ILookupOption): number {
  return typeof type === "number" ? type : type.id;
}

const PRESENTATION_DAY = 1;
const PRESENTATION_NIGHT = 2;

/** Önizleme tipi: geceyse bağlı nightImage, yoksa gündüz image. */
function itemPreviewUrl(item: IWorkspaceItem, previewType: number): string | null {
  if (previewType === PRESENTATION_NIGHT && item.nightImage?.url) {
    return item.nightImage.url;
  }
  return item.image?.url ?? null;
}

function PresentationTypeIcon({ id }: { id: number }) {
  if (id === 2) return <DarkModeOutlinedIcon fontSize="small" />;
  if (id === 3) return <ContrastIcon fontSize="small" />;
  return <LightModeOutlinedIcon fontSize="small" />;
}

/**
 * Çalışma alanı — production ile aynı filtre zinciri:
 * Panel Tipi seçilince Etap→Blok→Kat→Mülk (veya Dollhouse / Mülk Şablonu) kademeli açılır;
 * yaprak seçilince kareler yüklenir.
 */
export default function WorkspaceScreen({ projectId }: { projectId: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const [workspace, setWorkspace] = useState<IWorkspace | null>(null);
  const [projectUnits, setProjectUnits] = useState<IProjectUnit[]>([]);
  const [workspaceTours, setWorkspaceTours] = useState<IWorkspaceTour[]>([]);
  const [workspaceInfoCards, setWorkspaceInfoCards] = useState<IWorkspaceInfoCard[]>([]);
  const [stageBlocks, setStageBlocks] = useState<IWorkspaceBlock[]>([]);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number | null>(null);
  /** Bağlama menüsü yalnız çift tık / Düzenle ile açılır. */
  const [polygonPickerOpen, setPolygonPickerOpen] = useState(false);
  /** Daire Düzenleme modu: A1D2 etiketleri yalnız bu açıkken görünür. */
  const [unitEditMode, setUnitEditMode] = useState(false);
  /** Mod açıkken yan panel (daire seç / ad-numara kaydet). */
  const [unitEditDrawerOpen, setUnitEditDrawerOpen] = useState(false);
  /** Poligon/etiket değişti, henüz Kaydet basılmadı. */
  const [polygonsDirty, setPolygonsDirty] = useState(false);
  const [savingPolygons, setSavingPolygons] = useState(false);
  // Production'da kareler çoğunlukla etap/blokta; Proje paneli boş açılmasın
  const [entityType, setEntityType] = useState<number | "">(EntityTypeEnum.ProjectStage);
  const [entityId, setEntityId] = useState<number | "">("");
  const [selectedStage, setSelectedStage] = useState<LookupOption | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<LookupOption | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<LookupOption | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<LookupOption | null>(null);
  const [selectedDollhouse, setSelectedDollhouse] = useState<LookupOption | null>(null);
  const [selectedUnitTemplate, setSelectedUnitTemplate] = useState<LookupOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState<IWorkspaceItem | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<IWorkspaceItem | null>(null);
  /** true → seçili kareye gece görseli bağla/değiştir (nightImage). */
  const [replaceIsNight, setReplaceIsNight] = useState(false);
  // Production footer şeridindeki seçili kare — tuvalde büyük gösterilir
  const [selectedItemId, setSelectedItemId] = useState<number | string | null>(null);
  const [onlyMainFrames, setOnlyMainFrames] = useState(true);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [deleteItemOpen, setDeleteItemOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  // Sunum tipi (gündüz/gece/karma): API hangi tipleri destekliyorsa yalnızca onlar seçilebilir.
  const [presentationType, setPresentationType] = useState<number>(1);
  const [compassOpen, setCompassOpen] = useState(false);
  const [compassValue, setCompassValue] = useState(0);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  /** Blok görünümü: null = hepsi, Floor/Unit = tip filtresi. */
  const [polygonTypeFilter, setPolygonTypeFilter] = useState<number | null>(null);
  const workspaceLock = useWorkspaceLock({ projectId, entityType, entityId });
  // API başkasının kilidinde yazmayı zaten reddeder; burada kullanıcı işi bitirmeden uyarılır.
  const blockIfLocked = () => {
    if (!workspaceLock.readOnly) return false;
    enqueueSnackbar(t("Draw.WorkspaceLockedByOther"), { variant: "warning" });
    return true;
  };
  const [blockFloors, setBlockFloors] = useState<IWorkspaceFloor[]>([]);
  const stripRef = useRef<HTMLDivElement>(null);
  /** URL’den filtre restore edilmeden URL yazma. */
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const pendingItemIdRef = useRef<number | string | null>(null);

  const fetchWorkspace = useCallback(
    async (type: number, id: number) => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(ApiRoutes.Workspace, {
          params: { projectId, entityType: type, entityId: id },
          withoutToast: true,
          transformResponse: [
            (data: string) => {
              const parsed = JSON.parse(data);
              const big = JSONbig.parse(data);
              const items = parsed?.data?.items;
              const bigItems = big?.data?.items;
              if (Array.isArray(items) && Array.isArray(bigItems)) {
                parsed.data.items = items.map((item: IWorkspaceItem, index: number) => {
                  const bigPolygons = bigItems[index]?.polygons;
                  if (!Array.isArray(item?.polygons) || !Array.isArray(bigPolygons)) return item;
                  return {
                    ...item,
                    polygons: item.polygons.map((polygon, polygonIndex) => {
                      const bigPolygon = bigPolygons[polygonIndex] ?? {};
                      return {
                        ...polygon,
                        navigationId:
                          bigPolygon.navigationId != null ? String(bigPolygon.navigationId) : polygon.navigationId,
                        relatedEntityId:
                          bigPolygon.relatedEntityId != null
                            ? String(bigPolygon.relatedEntityId)
                            : polygon.relatedEntityId,
                      };
                    }),
                  };
                });
              }
              return parsed;
            },
          ],
        });
        if (response?.data?.isSuccess) {
          setWorkspace(response.data.data as IWorkspace);
          setPolygonsDirty(false);
        } else {
          enqueueSnackbar(response?.data?.messages?.[0]?.message ?? t("Toast.Error"), {
            variant: "error",
          });
        }
      } catch {
        enqueueSnackbar(t("Toast.Error"), { variant: "error" });
      } finally {
        setLoading(false);
      }
    },
    [projectId, enqueueSnackbar, t]
  );

  useEffect(() => {
    let cancelled = false;
    fetchProjectUnits(projectId)
      .then((rows) => {
        if (!cancelled) setProjectUnits(rows);
      })
      .catch(() => {
        if (!cancelled) setProjectUnits([]);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const reloadWorkspaceTours = useCallback(() => {
    return fetchWorkspaceTours(projectId, entityType, entityId)
      .then((rows) => setWorkspaceTours(rows))
      .catch(() => setWorkspaceTours([]));
  }, [projectId, entityType, entityId]);

  const reloadWorkspaceInfoCards = useCallback(() => {
    // Bilgi kartı bağlama yalnız etapta; minimap tur+URL.
    if (entityType !== EntityTypeEnum.ProjectStage) {
      setWorkspaceInfoCards([]);
      return Promise.resolve();
    }
    return fetchProjectInfoCards(projectId)
      .then((rows) => setWorkspaceInfoCards(rows))
      .catch(() => setWorkspaceInfoCards([]));
  }, [projectId, entityType]);

  useEffect(() => {
    void reloadWorkspaceTours();
  }, [reloadWorkspaceTours]);

  useEffect(() => {
    void reloadWorkspaceInfoCards();
  }, [reloadWorkspaceInfoCards]);

  // Bağlama paneli açılınca tur/kart listesini yenile (yeni eklenenler görünsün).
  useEffect(() => {
    if (!polygonPickerOpen) return;
    void reloadWorkspaceTours();
    void reloadWorkspaceInfoCards();
  }, [polygonPickerOpen, reloadWorkspaceTours, reloadWorkspaceInfoCards]);

  // Etap çalışma alanında Fine3D "A Blok" etiketleri için blok listesi
  useEffect(() => {
    if (entityType !== EntityTypeEnum.ProjectStage || typeof entityId !== "number") {
      setStageBlocks([]);
      return;
    }
    let cancelled = false;
    void fetchProjectBlocks(projectId, entityId)
      .then((rows) => {
        if (!cancelled) setStageBlocks(rows);
      })
      .catch(() => {
        if (!cancelled) setStageBlocks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, entityType, entityId]);

  // Açılış: URL’deki filtreyi geri yükle; yoksa ilk etaba düş ve URL’ye yaz
  useEffect(() => {
    let cancelled = false;
    setFiltersHydrated(false);
    pendingItemIdRef.current = null;

    (async () => {
      setLoading(true);
      try {
        const query = workspaceQueryToParams(typeof window !== "undefined" ? window.location.search : "");
        const restoredType = isWorkspaceEntityType(query.entityType) ? query.entityType : null;
        const restoredEntityId = query.entityId != null && query.entityId !== "" ? Number(query.entityId) : NaN;

        if (query.presentationType != null) setPresentationType(query.presentationType);
        if (query.onlyMainFrames != null) setOnlyMainFrames(query.onlyMainFrames);
        if (query.polygonTypeFilter !== undefined) setPolygonTypeFilter(query.polygonTypeFilter);
        if (query.selectedWorkspaceItemId) {
          // Minimap vb. Guid id; sayısal id de olabilir.
          const raw = query.selectedWorkspaceItemId;
          const asNum = Number(raw);
          pendingItemIdRef.current =
            Number.isFinite(asNum) && String(asNum) === raw ? asNum : raw;
        }

        setSelectedStage(optionFromQuery(query.selectedStageId, query.selectedStageTitle));
        setSelectedBlock(optionFromQuery(query.selectedBlockId, query.selectedBlockTitle));
        setSelectedFloor(optionFromQuery(query.selectedFloorId, query.selectedFloorTitle));
        setSelectedUnit(optionFromQuery(query.selectedUnitId, query.selectedUnitTitle));
        setSelectedDollhouse(optionFromQuery(query.selectedDollhouseId, query.selectedDollhouseTitle));
        setSelectedUnitTemplate(optionFromQuery(query.selectedUnitTemplateId, query.selectedUnitTemplateTitle));

        if (restoredType != null && Number.isFinite(restoredEntityId) && restoredEntityId > 0) {
          setEntityType(restoredType);
          setEntityId(restoredEntityId);
          await fetchWorkspace(restoredType, restoredEntityId);
          if (!cancelled) setFiltersHydrated(true);
          return;
        }

        if (restoredType === EntityTypeEnum.Project || restoredType === EntityTypeEnum.ProjectMinimap) {
          setEntityType(restoredType);
          setEntityId(projectId);
          await fetchWorkspace(restoredType, projectId);
          if (!cancelled) setFiltersHydrated(true);
          return;
        }

        // URL’de tamamlanmamış filtre: tipi/kademeyi göster, kare yükleme
        if (restoredType != null) {
          setEntityType(restoredType);
          setEntityId("");
          const meta = await axiosInstance.get(ApiRoutes.Workspace, {
            params: { projectId, entityType: EntityTypeEnum.Project, entityId: projectId },
            withoutToast: true,
          });
          if (!cancelled && meta?.data?.isSuccess) setWorkspace(meta.data.data as IWorkspace);
          if (!cancelled) setFiltersHydrated(true);
          return;
        }

        // İlk ziyaret: meta + ilk etap
        const meta = await axiosInstance.get(ApiRoutes.Workspace, {
          params: { projectId, entityType: EntityTypeEnum.Project, entityId: projectId },
          withoutToast: true,
        });
        if (cancelled) return;
        if (meta?.data?.isSuccess) setWorkspace(meta.data.data as IWorkspace);

        const stagesRes = await axiosInstance.patch(
          ApiRoutes.Stages,
          { pageNumber: 1, rowCount: 50, projectId },
          { withoutToast: true }
        );
        if (cancelled) return;
        const first = (stagesRes?.data?.data as Array<{ id: number; name?: string }> | undefined)?.[0];
        if (first?.id) {
          const option = { id: first.id, title: first.name || `#${first.id}` };
          setSelectedStage(option);
          setEntityType(EntityTypeEnum.ProjectStage);
          setEntityId(first.id);
          await fetchWorkspace(EntityTypeEnum.ProjectStage, first.id);
        }
        if (!cancelled) setFiltersHydrated(true);
      } catch {
        enqueueSnackbar(t("Toast.Error"), { variant: "error" });
        if (!cancelled) setFiltersHydrated(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, fetchWorkspace, enqueueSnackbar, t]);

  // Filtre değişince URL’yi güncelle — F5 aynı yerde kalsın
  useEffect(() => {
    if (!filtersHydrated) return;
    updateWorkspaceQueryParams({
      entityType: typeof entityType === "number" ? entityType : undefined,
      entityId: entityId !== "" ? String(entityId) : undefined,
      selectedStageId: selectedStage ? String(selectedStage.id) : undefined,
      selectedStageTitle: selectedStage?.title,
      selectedBlockId: selectedBlock ? String(selectedBlock.id) : undefined,
      selectedBlockTitle: selectedBlock?.title,
      selectedFloorId: selectedFloor ? String(selectedFloor.id) : undefined,
      selectedFloorTitle: selectedFloor?.title,
      selectedUnitId: selectedUnit ? String(selectedUnit.id) : undefined,
      selectedUnitTitle: selectedUnit?.title,
      selectedDollhouseId: selectedDollhouse ? String(selectedDollhouse.id) : undefined,
      selectedDollhouseTitle: selectedDollhouse?.title,
      selectedUnitTemplateId: selectedUnitTemplate ? String(selectedUnitTemplate.id) : undefined,
      selectedUnitTemplateTitle: selectedUnitTemplate?.title,
      selectedWorkspaceItemId: selectedItemId != null ? String(selectedItemId) : undefined,
      presentationType,
      polygonTypeFilter: entityType === EntityTypeEnum.Block ? polygonTypeFilter : undefined,
      onlyMainFrames,
    });
  }, [
    filtersHydrated,
    entityType,
    entityId,
    selectedStage,
    selectedBlock,
    selectedFloor,
    selectedUnit,
    selectedDollhouse,
    selectedUnitTemplate,
    selectedItemId,
    presentationType,
    polygonTypeFilter,
    onlyMainFrames,
  ]);

  const clearCascade = () => {
    setSelectedStage(null);
    setSelectedBlock(null);
    setSelectedFloor(null);
    setSelectedUnit(null);
    setSelectedDollhouse(null);
    setSelectedUnitTemplate(null);
  };

  const clearFrames = () => {
    setWorkspace((prev) => (prev ? { ...prev, items: [] } : prev));
  };

  const loadLeaf = (type: number, id: number | string) => {
    const numericId = Number(id);
    setEntityId(numericId);
    void fetchWorkspace(type, numericId);
  };

  const handleEntityTypeChange = (type: number) => {
    setEntityType(type);
    clearCascade();
    clearFrames();
    setPolygonTypeFilter(null);
    setBlockFloors([]);
    setUnitEditMode(false);
    setUnitEditDrawerOpen(false);
    setPolygonPickerOpen(false);
    setEditing(null);

    // Proje ve minimap: ek filtre yok, doğrudan proje id
    if (type === EntityTypeEnum.Project || type === EntityTypeEnum.ProjectMinimap) {
      setEntityId(projectId);
      void fetchWorkspace(type, projectId);
      return;
    }

    setEntityId("");
  };

  const handleStageChange = (value: LookupOption | null) => {
    setSelectedStage(value);
    setSelectedBlock(null);
    setSelectedFloor(null);
    setSelectedUnit(null);
    clearFrames();
    if (value?.id && entityType === EntityTypeEnum.ProjectStage) {
      loadLeaf(EntityTypeEnum.ProjectStage, value.id);
    } else {
      setEntityId("");
    }
  };

  const handleBlockChange = (value: LookupOption | null) => {
    setSelectedBlock(value);
    setSelectedFloor(null);
    setSelectedUnit(null);
    setPolygonTypeFilter(null);
    clearFrames();
    if (value?.id && entityType === EntityTypeEnum.Block) {
      loadLeaf(EntityTypeEnum.Block, value.id);
    } else {
      setEntityId("");
    }
  };

  const handleFloorChange = (value: LookupOption | null) => {
    setSelectedFloor(value);
    setSelectedUnit(null);
    clearFrames();
    if (value?.id && entityType === EntityTypeEnum.Floor) {
      loadLeaf(EntityTypeEnum.Floor, value.id);
    } else {
      setEntityId("");
    }
  };

  const handleUnitChange = (value: LookupOption | null) => {
    setSelectedUnit(value);
    clearFrames();
    if (value?.id && entityType === EntityTypeEnum.Unit) {
      loadLeaf(EntityTypeEnum.Unit, value.id);
    } else {
      setEntityId("");
    }
  };

  const handleDollhouseChange = (value: LookupOption | null) => {
    setSelectedDollhouse(value);
    clearFrames();
    if (value?.id && entityType === EntityTypeEnum.Dollhouse) {
      loadLeaf(EntityTypeEnum.Dollhouse, value.id);
    } else {
      setEntityId("");
    }
  };

  const handleUnitTemplateChange = (value: LookupOption | null) => {
    setSelectedUnitTemplate(value);
    clearFrames();
    if (value?.id && entityType === EntityTypeEnum.UnitTemplate) {
      loadLeaf(EntityTypeEnum.UnitTemplate, value.id);
    } else {
      setEntityId("");
    }
  };

  const entityTypes: number[] = workspace?.entityTypes ?? [
    EntityTypeEnum.Project,
    EntityTypeEnum.ProjectStage,
    EntityTypeEnum.Block,
    EntityTypeEnum.Floor,
    EntityTypeEnum.Unit,
    EntityTypeEnum.Dollhouse,
    EntityTypeEnum.UnitTemplate,
    EntityTypeEnum.ProjectMinimap,
  ];
  const allItems = workspace?.items ?? null;
  const presentationIds = useMemo(() => {
    const ids = (workspace?.presentationTypes ?? []).map(presentationTypeId);
    // API (kaynaktan aynen) minimap'e yalnız gündüz tipini veriyor; ama tek-kare + nightImage
    // modelinde ayrı gece karesi açılmıyor, aynı kareye gece görseli bağlanıyor ve o uç tipe
    // bakmıyor. Gece'yi burada ekleyince dual model (önizleme, ay ikonu) minimap'te de çalışır.
    if (entityType === EntityTypeEnum.ProjectMinimap && ids.length > 0 && !ids.includes(PRESENTATION_NIGHT)) {
      return [...ids, PRESENTATION_NIGHT];
    }
    return ids;
  }, [workspace?.presentationTypes, entityType]);

  // API tip listesi değişince (ör. farklı lisans) seçili tip listede yoksa ilkine düş.
  useEffect(() => {
    if (presentationIds.length > 0 && !presentationIds.includes(presentationType)) setPresentationType(presentationIds[0]);
  }, [presentationIds, presentationType]);
  const itemCount = allItems?.length ?? 0;
  const itemLimit = workspace?.itemLimit ?? 0;
  const selectionReady = entityType !== "" && entityId !== "";
  const canAddMore = selectionReady && (itemLimit <= 0 || itemCount < itemLimit);

  // Gece modu açık entity'lerde tek liste: gündüz+bağlı gece aynı frame (poligonlar paylaşılır).
  const dualDayNight = presentationIds.includes(PRESENTATION_NIGHT);

  // Ana kare filtresi (production showMainFrame)
  const items = useMemo(() => {
    if (!allItems) return null;
    const sorted = [...allItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    // Dual model: sunum tipine göre ayırma. Legacy: tip listesi birden fazlaysa eski filtre.
    const byPresentation = dualDayNight
      ? sorted
      : presentationIds.length > 1
        ? sorted.filter((item) => (item.presentationType ?? presentationIds[0]) === presentationType)
        : sorted;
    // Minimap / kat / mülk şablonu tek kare: Ana Kare filtresi boş ekran bırakmasın
    // (prod verisinde mainFrame=false olabiliyor).
    const singleSlot =
      entityType === EntityTypeEnum.ProjectMinimap ||
      entityType === EntityTypeEnum.Floor ||
      entityType === EntityTypeEnum.UnitTemplate ||
      (itemLimit === 1 && byPresentation.length > 0);
    if (singleSlot) return byPresentation;
    if (!onlyMainFrames) return byPresentation;
    const mains = byPresentation.filter((item) => item.mainFrame);
    // Ana Kare açık ama hiç ana kare yoksa tümünü göster (yükleme / düzenleme mümkün olsun).
    return mains.length > 0 ? mains : byPresentation;
  }, [allItems, onlyMainFrames, presentationIds, presentationType, entityType, itemLimit, dualDayNight]);

  // Liste değişince seçili kareyi koru (URL’den gelen varsa onu tercih et) veya ilk kareye düş
  useEffect(() => {
    if (!items?.length) {
      setSelectedItemId(null);
      return;
    }
    const pending = pendingItemIdRef.current;
    if (pending != null) {
      pendingItemIdRef.current = null;
      if (items.some((item) => item.id === pending)) {
        setSelectedItemId(pending);
        return;
      }
    }
    const stillThere = selectedItemId != null && items.some((item) => item.id === selectedItemId);
    if (!stillThere) setSelectedItemId(items[0].id);
  }, [items, selectedItemId]);

  // Şeritte tekerlek → yatay kaydırma (daha uzun adım + yumuşak interpolasyon)
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return undefined;
    let raf = 0;
    let target = el.scrollLeft;
    const SPEED = 2.8;
    const EASE = 0.16;

    const tick = () => {
      const current = el.scrollLeft;
      const next = current + (target - current) * EASE;
      if (Math.abs(target - next) < 0.6) {
        el.scrollLeft = target;
        raf = 0;
        return;
      }
      el.scrollLeft = next;
      raf = requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const raw = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      const pixels = event.deltaMode === 1 ? raw * 16 : event.deltaMode === 2 ? raw * el.clientWidth : raw;
      const max = el.scrollWidth - el.clientWidth;
      target = Math.max(0, Math.min(max, target + pixels * SPEED));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items?.length]);

  const selectedItem = useMemo(
    () => items?.find((item) => item.id === selectedItemId) ?? items?.[0] ?? null,
    [items, selectedItemId]
  );
  const selectedPreviewUrl = selectedItem ? itemPreviewUrl(selectedItem, presentationType) : null;

  useEffect(() => {
    setNaturalSize({ width: 0, height: 0 });
    setSelectedPolygonIndex(null);
  }, [selectedItem?.id, selectedPreviewUrl]);

  // Blok seçilince kat listesini çek — kat etiketleri için
  useEffect(() => {
    if (entityType !== EntityTypeEnum.Block || !selectedBlock?.id) {
      setBlockFloors([]);
      return;
    }
    let cancelled = false;
    void fetchBlockFloors(Number(selectedBlock.id)).then((floors) => {
      if (!cancelled) setBlockFloors(floors);
    });
    return () => {
      cancelled = true;
    };
  }, [entityType, selectedBlock?.id]);

  const unitsById = useMemo(() => new Map(projectUnits.map((unit) => [unit.id, unit])), [projectUnits]);
  const toursById = useMemo(() => new Map(workspaceTours.map((tour) => [tour.id, tour])), [workspaceTours]);
  const infoCardsById = useMemo(
    () => new Map(workspaceInfoCards.map((card) => [card.id, card])),
    [workspaceInfoCards]
  );
  const floorsById = useMemo(() => new Map(blockFloors.map((floor) => [floor.id, floor])), [blockFloors]);
  const blocksById = useMemo(() => new Map(stageBlocks.map((block) => [block.id, block])), [stageBlocks]);
  const isMinimap = entityType === EntityTypeEnum.ProjectMinimap;
  const isStage = entityType === EntityTypeEnum.ProjectStage;
  /** Minimap + etap: sağ tık ile nokta (dot) eklenir. */
  const canAddPoints = isMinimap || isStage;
  const canAssignUnit = entityAllowsUnit(entityType);
  const canAssignTour = entityAllowsVirtualTour(entityType);
  const canAssignInfoCard = entityAllowsInfoCard(entityType);
  const canAssignBlock = entityAllowsBlock(entityType);
  const showBlockTypeFilter = entityType === EntityTypeEnum.Block && selectionReady;

  const polygonLabels = useMemo(
    () =>
      (selectedItem?.polygons ?? []).map((polygon) => {
        // Etap: yazılar (blok/kart etiketleri) direkt görünmez.
        if (isStage) return "";
        if (!polygonMatchesTypeFilter(polygon, polygonTypeFilter)) return "";
        const label = polygonDisplayLabel(
          polygon,
          unitsById,
          toursById,
          floorsById,
          polygonTypeFilter,
          blocksById,
          infoCardsById
        );
        // Daire yazıları yalnız Daire Düzenleme modunda; blok pinleri diğer panellerde kalabilir.
        const isBlockPin = Number(polygon.entityType) === EntityTypeEnum.Block;
        if (!isBlockPin && !unitEditMode) return "";
        return label;
      }),
    [selectedItem?.polygons, unitsById, toursById, floorsById, polygonTypeFilter, blocksById, infoCardsById, unitEditMode, isStage]
  );

  // Filtre dışı kalan seçili poligonu temizle
  useEffect(() => {
    if (selectedPolygonIndex == null || !selectedItem?.polygons) return;
    const polygon = selectedItem.polygons[selectedPolygonIndex];
    if (polygon && !polygonMatchesTypeFilter(polygon, polygonTypeFilter)) {
      setSelectedPolygonIndex(null);
    }
  }, [polygonTypeFilter, selectedPolygonIndex, selectedItem?.polygons]);

  const selectedPolygon = selectedPolygonIndex != null ? selectedItem?.polygons?.[selectedPolygonIndex] ?? null : null;
  const selectedPolygonUnit = selectedPolygon ? unitsById.get(Number(selectedPolygon.relatedEntityId)) ?? null : null;
  const selectedPolygonTour = selectedPolygon && polygonHasVirtualTour(selectedPolygon)
    ? toursById.get(String(selectedPolygon.navigationId ?? "")) ?? null
    : null;
  const selectedPolygonSceneId =
    selectedPolygon && polygonHasVirtualTour(selectedPolygon)
      ? String(selectedPolygon.navigationValue ?? "").trim() || null
      : null;
  const selectedPolygonInfoCard =
    selectedPolygon && polygonHasInfoCard(selectedPolygon)
      ? infoCardsById.get(Number(selectedPolygon.navigationId)) ?? null
      : null;
  const selectedPolygonUrl =
    selectedPolygon && polygonHasUrl(selectedPolygon)
      ? String(selectedPolygon.navigationValue ?? "").trim() || null
      : null;
  const selectedPolygonBlock =
    selectedPolygon && Number(selectedPolygon.entityType) === EntityTypeEnum.Block
      ? blocksById.get(Number(selectedPolygon.relatedEntityId)) ?? null
      : null;
  const selectedIsBlockPin = Boolean(selectedPolygonBlock);
  /** Tek noktalı pin (minimap / etap); blok poligonu değil. */
  const selectedIsPointMarker =
    Boolean(selectedPolygon) &&
    (selectedPolygon?.points?.length ?? 0) === 1 &&
    !selectedIsBlockPin;

  const selectedNavKind = (() => {
    if (!selectedPolygon) return null;
    if (polygonHasInfoCard(selectedPolygon)) return "infoCard" as const;
    if (polygonHasVirtualTour(selectedPolygon)) return "tour" as const;
    if (polygonHasUrl(selectedPolygon)) return "url" as const;
    if (polygonHasProject(selectedPolygon)) return "project" as const;
    if (selectedIsBlockPin || Number(selectedPolygon.navigationType) === 5) return "block" as const;
    if (Number(selectedPolygon.navigationType) === 0) return "none" as const;
    return null;
  })();

  const nextOrder = useMemo(() => {
    if (!allItems?.length) return 1;
    return Math.max(...allItems.map((item) => item.order ?? 0)) + 1;
  }, [allItems]);

  // Yeni kareler, kullanıcının o an baktığı sunum tipinde oluşturulur.
  // Yeni kareler dual modda her zaman gündüz kaydı; gece görseli sonra bağlanır.
  const defaultPresentation = dualDayNight ? PRESENTATION_DAY : presentationType;

  const persistItem = useCallback(
    async (item: IWorkspaceItem, patch: Partial<IWorkspaceItem> & { polygons?: ISvgPolygon[] }) => {
      if (typeof entityType !== "number" || typeof entityId !== "number") return false;
      const response = await axiosInstance.put(
        ApiRoutes.WorkspaceItems,
        {
          entityId,
          entityType,
          items: [
            {
              id: item.id,
              order: patch.order ?? item.order,
              mainFrame: patch.mainFrame ?? item.mainFrame,
              compassDegree: patch.compassDegree ?? item.compassDegree,
              polygons: patch.polygons ?? item.polygons ?? [],
            },
          ],
        },
        { withoutToast: true }
      );
      return Boolean(response?.data?.isSuccess);
    },
    [entityType, entityId]
  );

  /** Yerel güncelle — sunucuya yazmaz; Kaydet bekler. */
  const applyLocalPolygons = (polygons: ISvgPolygon[]) => {
    if (!selectedItem) return;
    setWorkspace((prev) =>
      prev
        ? {
            ...prev,
            items: (prev.items ?? []).map((item) => (item.id === selectedItem.id ? { ...item, polygons } : item)),
          }
        : prev
    );
    setPolygonsDirty(true);
  };

  const handleSavePolygons = async () => {
    if (!selectedItem || !polygonsDirty) return;
    if (blockIfLocked()) return;
    setSavingPolygons(true);
    try {
      const ok = await persistItem(selectedItem, { polygons: selectedItem.polygons ?? [] });
      if (ok) {
        setPolygonsDirty(false);
        enqueueSnackbar(t("Toast.Success"), { variant: "success" });
      } else {
        enqueueSnackbar(t("Toast.Error"), { variant: "error" });
      }
    } catch {
      enqueueSnackbar(t("Toast.Error"), { variant: "error" });
    } finally {
      setSavingPolygons(false);
    }
  };

  const openLabelEditor = () => {
    if (!selectedItem?.polygons?.length) {
      enqueueSnackbar(t("Form.NotFound"), { variant: "info" });
      return;
    }
    if (selectedPolygonIndex == null) setSelectedPolygonIndex(0);
    setPolygonPickerOpen(true);
  };

  /** Minimap / etap: sağ tık → nokta (dot) ekle. */
  const handleAddPoint = (worldX: number, worldY: number) => {
    if (!selectedItem || !canAddPoints) return;
    const point: ISvgPolygon = {
      id: crypto.randomUUID(),
      type: 0,
      shapeType: 0,
      entityType: null,
      relatedEntityId: null,
      navigationType: 0,
      navigationId: null,
      navigationValue: null,
      points: [{ x: Math.round(worldX), y: Math.round(worldY), cp: null }],
    };
    const polygons = [...(selectedItem.polygons ?? []), point];
    applyLocalPolygons(polygons);
    setSelectedPolygonIndex(polygons.length - 1);
    setPolygonPickerOpen(true);
  };

  const handleDeleteSelectedPolygon = () => {
    if (!selectedItem || selectedPolygonIndex == null) return;
    const polygons = [...(selectedItem.polygons ?? [])];
    if (!polygons[selectedPolygonIndex]) return;
    polygons.splice(selectedPolygonIndex, 1);
    applyLocalPolygons(polygons);
    setSelectedPolygonIndex(null);
    setPolygonPickerOpen(false);
  };

  const handleAssignUnit = (unit: IProjectUnit) => {
    if (!selectedItem || selectedPolygonIndex == null) return;
    const polygons = [...(selectedItem.polygons ?? [])];
    const current = polygons[selectedPolygonIndex];
    if (!current) return;
    polygons[selectedPolygonIndex] = assignUnitToPolygon(current, unit);
    applyLocalPolygons(polygons);
  };

  const handleUnitUpdated = (unit: IProjectUnit) => {
    setProjectUnits((prev) => {
      const next = prev.map((row) => (row.id === unit.id ? { ...row, ...unit } : row));
      if (!next.some((row) => row.id === unit.id)) next.push(unit);
      return next;
    });
  };

  const handleAssignTour = (tour: IWorkspaceTour, sceneId: string) => {
    if (!selectedItem || selectedPolygonIndex == null || !sceneId) return;
    const polygons = [...(selectedItem.polygons ?? [])];
    const current = polygons[selectedPolygonIndex];
    if (!current) return;
    polygons[selectedPolygonIndex] = assignTourToPolygon(current, tour, sceneId);
    applyLocalPolygons(polygons);
    setPolygonPickerOpen(false);
  };

  const handleAssignInfoCard = (card: IWorkspaceInfoCard) => {
    if (!selectedItem || selectedPolygonIndex == null) return;
    const polygons = [...(selectedItem.polygons ?? [])];
    const current = polygons[selectedPolygonIndex];
    if (!current) return;
    polygons[selectedPolygonIndex] = assignInfoCardToPolygon(current, card);
    applyLocalPolygons(polygons);
    setPolygonPickerOpen(false);
  };

  const handleAssignUrl = (url: string) => {
    if (!selectedItem || selectedPolygonIndex == null) return;
    const polygons = [...(selectedItem.polygons ?? [])];
    const current = polygons[selectedPolygonIndex];
    if (!current) return;
    polygons[selectedPolygonIndex] = assignUrlToPolygon(current, url);
    applyLocalPolygons(polygons);
    setPolygonPickerOpen(false);
  };

  const handleAssignBlock = (block: IWorkspaceBlock) => {
    if (!selectedItem || selectedPolygonIndex == null) return;
    const polygons = [...(selectedItem.polygons ?? [])];
    const current = polygons[selectedPolygonIndex];
    if (!current) return;
    polygons[selectedPolygonIndex] = assignBlockToPolygon(current, block);
    applyLocalPolygons(polygons);
    setPolygonPickerOpen(false);
  };

  const handleAssignProject = () => {
    if (!selectedItem || selectedPolygonIndex == null) return;
    const polygons = [...(selectedItem.polygons ?? [])];
    const current = polygons[selectedPolygonIndex];
    if (!current) return;
    polygons[selectedPolygonIndex] = assignProjectToPolygon(current, projectId);
    applyLocalPolygons(polygons);
    setPolygonPickerOpen(false);
  };

  const handleClearUnit = () => {
    if (!selectedItem || selectedPolygonIndex == null) return;
    const polygons = [...(selectedItem.polygons ?? [])];
    const current = polygons[selectedPolygonIndex];
    if (!current) return;
    polygons[selectedPolygonIndex] = clearPolygonUnit(current);
    applyLocalPolygons(polygons);
  };

  const handleLabelOffsetAt = (index: number, offsetX: number, offsetY: number) => {
    if (!selectedItem) return;
    const polygons = [...(selectedItem.polygons ?? [])];
    const current = polygons[index];
    if (!current) return;
    polygons[index] = {
      ...current,
      labelOffsetX: offsetX,
      labelOffsetY: offsetY,
    };
    applyLocalPolygons(polygons);
  };

  const handleSave = async (polygons: ISvgPolygon[]) => {
    if (!editing) return;
    if (blockIfLocked()) return;
    try {
      const ok = await persistItem(editing, { polygons });
      if (ok) {
        enqueueSnackbar(t("Toast.Success"), { variant: "success" });
        setEditing(null);
        if (typeof entityType === "number" && typeof entityId === "number") {
          void fetchWorkspace(entityType, entityId);
        }
      } else {
        enqueueSnackbar(t("Toast.Error"), { variant: "error" });
      }
    } catch {
      enqueueSnackbar(t("Toast.Error"), { variant: "error" });
    }
  };

  const handleApplyJson = (polygons: ISvgPolygon[]) => {
    if (!selectedItem) return;
    applyLocalPolygons(polygons);
    setJsonOpen(false);
  };

  const handleToggleMainFrame = async () => {
    if (!selectedItem) return;
    if (blockIfLocked()) return;
    const next = !selectedItem.mainFrame;
    if (next && (workspace?.mainFrameLimit ?? 0) > 0) {
      const current = allItems?.filter((item) => item.mainFrame).length ?? 0;
      if (current >= (workspace?.mainFrameLimit ?? 0)) {
        enqueueSnackbar(t("Draw.MaxiumumMainFrameWarning", { count: workspace?.mainFrameLimit ?? 0 }), {
          variant: "warning",
        });
        return;
      }
    }
    const ok = await persistItem(selectedItem, { mainFrame: next });
    if (ok) {
      enqueueSnackbar(t("Toast.Success"), { variant: "success" });
      if (typeof entityType === "number" && typeof entityId === "number") {
        void fetchWorkspace(entityType, entityId);
      }
    } else {
      enqueueSnackbar(t("Toast.Error"), { variant: "error" });
    }
  };

  const handleSaveCompass = async () => {
    if (!selectedItem) return;
    if (blockIfLocked()) return;
    const degree = Math.max(0, Math.min(360, Number(compassValue) || 0));
    const ok = await persistItem(selectedItem, { compassDegree: degree });
    if (ok) {
      enqueueSnackbar(t("Toast.Success"), { variant: "success" });
      setCompassOpen(false);
      if (typeof entityType === "number" && typeof entityId === "number") {
        void fetchWorkspace(entityType, entityId);
      }
    } else {
      enqueueSnackbar(t("Toast.Error"), { variant: "error" });
    }
  };

  // API gövdede `itemIdList` bekler (DeleteWorkspaceItemsCommand); tek ve toplu silme aynı yolu kullanır.
  const deleteItems = async (ids: Array<number | string>) => {
    if (ids.length === 0 || typeof entityType !== "number" || typeof entityId !== "number") return;
    if (blockIfLocked()) return;
    try {
      const response = await axiosInstance.delete(ApiRoutes.WorkspaceItems, {
        data: { entityId, entityType, itemIdList: ids },
        withoutToast: true,
      });
      if (response?.data?.isSuccess) {
        enqueueSnackbar(t("Toast.Success"), { variant: "success" });
        void fetchWorkspace(entityType, entityId);
      } else {
        enqueueSnackbar(response?.data?.messages?.[0]?.message ?? t("Toast.Error"), { variant: "error" });
      }
    } catch {
      enqueueSnackbar(t("Toast.Error"), { variant: "error" });
    }
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    if (typeof entityType !== "number" || typeof entityId !== "number") {
      enqueueSnackbar(t("Form.SelectEntity"), { variant: "warning" });
      return;
    }
    if (blockIfLocked()) return;

    const selectedType = entityType;
    const selectedId = entityId;
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;

    let accepted = files;
    if (itemLimit > 0) {
      const remaining = Math.max(0, itemLimit - itemCount);
      if (remaining <= 0) {
        enqueueSnackbar(t("Draw.UploadImageDialog.CannotAddMoreImages"), { variant: "warning" });
        return;
      }
      if (files.length > remaining) {
        accepted = files.slice(0, remaining);
        enqueueSnackbar(
          t("Draw.UploadImageDialog.MaxImagesExceeded", { max: itemLimit, skipped: files.length - remaining }),
          { variant: "warning" }
        );
      }
    }

    setUploading(true);
    try {
      await createWorkspaceItemsWithImages({
        entityId: selectedId,
        entityType: selectedType,
        files: accepted,
        startOrder: nextOrder,
        presentationType: defaultPresentation,
        // Minimap tek slot: ilk (veya tek) kare her zaman ana kare olsun.
        mainFrame:
          itemCount === 0 ||
          selectedType === EntityTypeEnum.ProjectMinimap ||
          selectedType === EntityTypeEnum.Floor ||
          selectedType === EntityTypeEnum.UnitTemplate,
      });
      enqueueSnackbar(t("Toast.Success"), { variant: "success" });
      await fetchWorkspace(selectedType, selectedId);
    } catch (error: unknown) {
      const message = error instanceof Error && error.message !== "upload-failed" ? error.message : t("Toast.Error");
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) void uploadFiles(event.target.files);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files?.length) void uploadFiles(event.dataTransfer.files);
  };

  const onReplacePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const target = replaceTarget;
    const asNight = replaceIsNight;
    if (!file || !target || typeof entityType !== "number" || typeof entityId !== "number") return;
    if (blockIfLocked()) return;

    const selectedType = entityType;
    const selectedId = entityId;

    setUploading(true);
    replaceWorkspaceItemImage({
      entityId: selectedId,
      entityType: selectedType,
      itemId: target.id,
      presentationType: asNight ? PRESENTATION_NIGHT : (target.presentationType ?? defaultPresentation),
      isNightImage: asNight,
      file,
    })
      .then(async () => {
        enqueueSnackbar(t("Toast.Success"), { variant: "success" });
        await fetchWorkspace(selectedType, selectedId);
      })
      .catch(() => enqueueSnackbar(t("Toast.Error"), { variant: "error" }))
      .finally(() => {
        setUploading(false);
        setReplaceTarget(null);
        setReplaceIsNight(false);
        if (replaceInputRef.current) replaceInputRef.current.value = "";
      });
  };

  const APP_BAR_HEIGHT = 80;
  // Thumbnail 120 + kalın scrollbar (~14) + padding
  const FOOTER_HEIGHT = 200;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        bgcolor: "contentBackground.main",
      }}
      data-testid="workspace-container"
    >
      {workspaceLock.readOnly && (
        <Alert severity="warning" square sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider" }}>
          {t("Draw.WorkspaceLockedByOther")}
        </Alert>
      )}
      {/* Production WorkspaceAppBar — tam genişlik filtre şeridi */}
      <Box
        component="header"
        sx={{
          // Sabit yükseklikte dar ekranda filtreler iki satıra kırılıp şeridin dışına (kilit
          // uyarısının ve tuvalin üstüne) taşıyordu; şerit içeriğe göre büyür.
          minHeight: APP_BAR_HEIGHT,
          py: 0.75,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "contentBackground.main",
          zIndex: 2,
        }}
      >
        <Tooltip title={t("Form.Back")}>
          <IconButton
            component={Link}
            href={`/${locale}${Routes.Project}/${projectId}`}
            size="small"
            sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider" }}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <WorkspaceEntityFilters
            projectId={projectId}
            entityTypes={entityTypes}
            entityType={entityType}
            selectedStage={selectedStage}
            selectedBlock={selectedBlock}
            selectedFloor={selectedFloor}
            selectedUnit={selectedUnit}
            selectedDollhouse={selectedDollhouse}
            selectedUnitTemplate={selectedUnitTemplate}
            onEntityTypeChange={handleEntityTypeChange}
            onStageChange={handleStageChange}
            onBlockChange={handleBlockChange}
            onFloorChange={handleFloorChange}
            onUnitChange={handleUnitChange}
            onDollhouseChange={handleDollhouseChange}
            onUnitTemplateChange={handleUnitTemplateChange}
          />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          {(loading || uploading) && <CircularProgress size={20} />}
          {selectionReady && (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap", mr: 0.5 }}>
              {t("Draw.UploadImageDialog.CurrentTotal", {
                current: onlyMainFrames ? items?.length ?? 0 : itemCount,
                total: itemLimit || "∞",
              })}
            </Typography>
          )}
          {showBlockTypeFilter && (
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              value={polygonTypeFilter ?? "all"}
              onChange={(_, value) => {
                if (value == null) return;
                setPolygonTypeFilter(value === "all" ? null : Number(value));
              }}
              data-cy="workspace-block-type-filter"
            >
              <ToggleButton value={PolygonTypeEnum.Unit}>{t("EntityType.4")}</ToggleButton>
              <ToggleButton value={PolygonTypeEnum.Floor}>{t("EntityType.3")}</ToggleButton>
              <ToggleButton value="all">{t("Draw.ShowAll")}</ToggleButton>
            </ToggleButtonGroup>
          )}
          {selectionReady && presentationIds.length > 1 && (
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              value={presentationType}
              onChange={(_, value) => {
                if (value != null) setPresentationType(value);
              }}
              data-cy="workspace-presentation-toggle"
            >
              {presentationIds.map((id) => (
                <ToggleButton key={id} value={id} aria-label={t(`PresentationType.${id}`)}>
                  <Tooltip title={t(`PresentationType.${id}`)}>
                    <span style={{ display: "inline-flex" }}>
                      <PresentationTypeIcon id={id} />
                    </span>
                  </Tooltip>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
          {selectedItem && (
            <>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={savingPolygons ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
                disabled={!polygonsDirty || savingPolygons}
                onClick={() => void handleSavePolygons()}
                data-cy="workspace-save-polygons"
              >
                {t("Button.Save")}
              </Button>
              <Tooltip title={selectedItem.mainFrame ? t("Form.MainFrame") : t("Draw.MainFrame")}>
                <IconButton
                  size="small"
                  onClick={() => void handleToggleMainFrame()}
                  color={selectedItem.mainFrame ? "primary" : "default"}
                  data-cy="workspace-main-frame"
                >
                  {selectedItem.mainFrame ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title={t("Draw.CompassDegree")}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setCompassValue(selectedItem.compassDegree ?? 0);
                    setCompassOpen(true);
                  }}
                >
                  <ExploreOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("Draw.Points")}>
                <IconButton size="small" onClick={() => setJsonOpen(true)}>
                  <DataObjectOutlinedIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          {itemCount > 0 && (
            <Tooltip title={t("Draw.DeleteAllWorkspaceItems")}>
              <IconButton size="small" color="error" onClick={() => setDeleteAllOpen(true)} data-cy="workspace-delete-all">
                <DeleteSweepIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t("Draw.HelpTitle")}>
            <IconButton size="small" onClick={() => setHelpOpen(true)} data-cy="workspace-help">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          {selectionReady && (
            <Button
              variant="contained"
              startIcon={<AddPhotoAlternateOutlinedIcon />}
              disabled={!canAddMore || uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {t("Draw.UploadImage")}
            </Button>
          )}
        </Stack>
      </Box>

      <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onFileInput} />
      <input ref={replaceInputRef} type="file" accept="image/*" hidden onChange={onReplacePick} />

      {/* Ana tuval — production WorkspaceDrawing alanı gibi tam genişlik */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          overflow: "hidden",
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {!selectionReady ? (
          <Alert severity="info" sx={{ maxWidth: 420 }}>
            {t("Form.SelectEntity")}
          </Alert>
        ) : !selectedItem ? (
          <Box
            onClick={() => canAddMore && !uploading && fileInputRef.current?.click()}
            sx={{
              p: 4,
              borderRadius: "12px",
              border: "1.5px dashed",
              borderColor: dragOver ? "primary.main" : "divider",
              bgcolor: dragOver ? "action.selected" : "background.paper",
              textAlign: "center",
              cursor: canAddMore && !uploading ? "pointer" : "default",
              maxWidth: 480,
            }}
            data-cy="workspace-upload-dropzone"
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
            <Typography sx={{ fontWeight: 700 }}>{t("Draw.DragDropText")}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t("Draw.SupportedFormats")}
            </Typography>
            {itemLimit > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                {t("Draw.UploadImageDialog.CanAddImageCount")} {Math.max(0, itemLimit - itemCount)}
              </Typography>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 1,
            }}
            data-cy={`workspace-frame-${selectedItem.id}`}
          >
            {selectedPreviewUrl ? (
              <Box
                sx={{
                  position: "relative",
                  display: "inline-block",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  lineHeight: 0,
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: dragOver ? "0 0 0 3px" : "none",
                  color: "primary.main",
                }}
              >
                <Box
                  component="img"
                  src={selectedPreviewUrl}
                  alt={selectedItem.image?.fileName ?? `#${selectedItem.id}`}
                  onLoad={(event) => {
                    const img = event.currentTarget;
                    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                  }}
                  sx={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: `calc(100vh - ${APP_BAR_HEIGHT + FOOTER_HEIGHT + 16}px)`,
                    objectFit: "contain",
                    userSelect: "none",
                  }}
                />
                <PolygonOverlay
                  polygons={selectedItem.polygons}
                  labels={polygonLabels}
                  selectedIndex={selectedPolygonIndex}
                  naturalWidth={naturalSize.width}
                  naturalHeight={naturalSize.height}
                  typeFilter={showBlockTypeFilter ? polygonTypeFilter : null}
                  pointMarkers={canAddPoints}
                  onBackgroundContextMenu={canAddPoints ? handleAddPoint : undefined}
                  onSelect={(index) => {
                    setSelectedPolygonIndex(index);
                    if (canAddPoints) {
                      // Noktaya / pin’e tık → sağda detay / bağlama
                      setPolygonPickerOpen(true);
                      return;
                    }
                    setPolygonPickerOpen(false);
                    if (unitEditMode) setUnitEditDrawerOpen(true);
                  }}
                  onDoubleSelect={(index) => {
                    setSelectedPolygonIndex(index);
                    if (!canAddPoints && unitEditMode) {
                      setPolygonPickerOpen(false);
                      setUnitEditDrawerOpen(true);
                      return;
                    }
                    setPolygonPickerOpen(true);
                  }}
                  onLabelMove={
                    isMinimap
                      ? undefined
                      : (index, offsetX, offsetY) => {
                          setSelectedPolygonIndex(index);
                          setPolygonPickerOpen(false);
                          handleLabelOffsetAt(index, offsetX, offsetY);
                        }
                  }
                />

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {canAddPoints && selectedPolygonIndex != null && selectedIsPointMarker && (
                    <Tooltip title={t("Form.Delete")}>
                      <IconButton
                        size="small"
                        color="error"
                        sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider" }}
                        onClick={handleDeleteSelectedPolygon}
                        data-cy="workspace-delete-point"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={t("Draw.ChooseDifferentImage")}>
                    <IconButton
                      size="small"
                      sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider" }}
                      onClick={() => {
                        setReplaceIsNight(false);
                        setReplaceTarget(selectedItem);
                        replaceInputRef.current?.click();
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {dualDayNight && (
                    <Tooltip
                      title={
                        selectedItem.nightImage?.url
                          ? t("Draw.ChangeNightImage")
                          : t("Draw.AddNightImage")
                      }
                    >
                      <IconButton
                        size="small"
                        color={selectedItem.nightImage?.url ? "primary" : "default"}
                        sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider" }}
                        onClick={() => {
                          setReplaceIsNight(true);
                          setReplaceTarget(selectedItem);
                          replaceInputRef.current?.click();
                        }}
                        data-cy="workspace-night-image"
                      >
                        <DarkModeOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {!isMinimap && (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<LabelOutlinedIcon />}
                        sx={{ bgcolor: "background.paper" }}
                        onClick={openLabelEditor}
                        data-cy="workspace-edit-labels"
                      >
                        {t("Form.Edit")}
                      </Button>
                      <Button variant="contained" size="small" onClick={() => setEditing(selectedItem)}>
                        {t("Form.Workspace")}
                      </Button>
                      {!isStage && (
                        <Button
                          variant={unitEditMode ? "outlined" : "contained"}
                          size="small"
                          onClick={() => {
                            setPolygonPickerOpen(false);
                            setUnitEditDrawerOpen(false);
                            setUnitEditMode((on) => !on);
                          }}
                          data-cy="workspace-edit-units"
                        >
                          {t("Project.EditUnits")}
                        </Button>
                      )}
                    </>
                  )}
                </Stack>

                <Stack
                  spacing={0.5}
                  sx={{ position: "absolute", bottom: 12, left: 12, right: 12, maxWidth: 520 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {isMinimap ? (
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: "rgba(0,0,0,.65)",
                        color: "#fff",
                        width: "fit-content",
                      }}
                    >
                      {t("Project.MinimapHint")}
                    </Typography>
                  ) : isStage ? (
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: "rgba(0,0,0,.65)",
                        color: "#fff",
                        width: "fit-content",
                      }}
                    >
                      {t("Project.StagePointHint")}
                    </Typography>
                  ) : (
                    canAssignBlock && (
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: "rgba(0,0,0,.65)",
                          color: "#fff",
                          width: "fit-content",
                        }}
                      >
                        {t("Project.LabelDragHint")}
                      </Typography>
                    )
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: "rgba(0,0,0,.55)",
                      color: "#fff",
                      width: "fit-content",
                    }}
                  >
                    #{selectedItem.id} · {t("Form.Order")}: {selectedItem.order} · {t("Form.Polygons")}:{" "}
                    {selectedItem.polygons?.length ?? 0}
                    {selectedItem.compassDegree != null ? ` · ${selectedItem.compassDegree}°` : ""}
                  </Typography>
                </Stack>
              </Box>
            ) : (
              <ImageNotSupportedIcon sx={{ fontSize: 64, color: "text.disabled" }} />
            )}
          </Box>
        )}
      </Box>

      {/* Production WorkspaceImages footer — yatay kare şeridi */}
      <Box
        component="footer"
        sx={{
          height: FOOTER_HEIGHT,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          px: 2,
          pt: 0.75,
          pb: 0.5,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "contentBackground.main",
        }}
      >
        {selectionReady && (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ alignSelf: "flex-start" }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={onlyMainFrames ? "main" : "all"}
              onChange={(_, value) => {
                if (value != null) setOnlyMainFrames(value === "main");
              }}
              data-cy="workspace-main-frame-filter"
            >
              <ToggleButton value="all">{t("Draw.ShowAll")}</ToggleButton>
              <ToggleButton value="main">{t("Form.MainFrame")}</ToggleButton>
            </ToggleButtonGroup>
            {selectedItem && (
              <Tooltip title={t("Form.Delete")}>
                <IconButton size="small" color="error" onClick={() => setDeleteItemOpen(true)} data-cy="workspace-delete-item">
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )}
        <Box sx={{ display: "flex", alignItems: "stretch", gap: 1.5, minHeight: 0, flex: 1 }}>
        <Box
          ref={stripRef}
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            overflowX: "scroll",
            overflowY: "hidden",
            pt: 1,
            pb: 1,
            scrollBehavior: "auto",
            // Varsayılan gri çubuk yerine marka turuncusu, ince hap
            scrollbarGutter: "stable",
            scrollbarWidth: "thin",
            scrollbarColor: "#F26522 transparent",
            "&::-webkit-scrollbar": { height: 8, display: "block" },
            "&::-webkit-scrollbar-track": {
              bgcolor: "transparent",
              borderRadius: 999,
              mx: 1,
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "#F26522",
              borderRadius: 999,
              minWidth: 48,
              "&:hover": { bgcolor: "#D9551A" },
            },
            "&::-webkit-scrollbar-button": { display: "none", width: 0, height: 0 },
          }}
        >
          {!selectionReady || !items?.length ? (
            <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
              {selectionReady ? t("Form.NoFrames") : t("Form.SelectEntity")}
            </Typography>
          ) : (
            items.map((item) => {
              const isSelected = item.id === selectedItem?.id;
              const thumbUrl = itemPreviewUrl(item, presentationType);
              return (
                <Box
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  onDoubleClick={() => {
                    if (!isMinimap) setEditing(item);
                  }}
                  sx={{
                    position: "relative",
                    width: 170,
                    height: 120,
                    flexShrink: 0,
                    borderRadius: "12px",
                    overflow: "hidden",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    border: "3px solid",
                    borderColor: isSelected ? "#F26522" : "transparent",
                    boxShadow: isSelected ? "0 0 0 1px #F26522, 0 0 10px rgba(242, 101, 34, 0.45)" : "none",
                    bgcolor: "action.disabledBackground",
                    backgroundImage: thumbUrl ? `url(${thumbUrl})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: "border-color .18s ease, box-shadow .18s ease",
                  }}
                  data-cy={`workspace-strip-${item.id}`}
                >
                  {!thumbUrl && (
                    <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                      <ImageNotSupportedIcon sx={{ color: "text.disabled" }} />
                    </Box>
                  )}
                  {item.mainFrame && (
                    <Chip
                      size="small"
                      color="primary"
                      label={t("Form.MainFrame")}
                      sx={{ position: "absolute", top: 4, left: 4, height: 22, fontSize: 10 }}
                    />
                  )}
                  {dualDayNight && item.nightImage?.url && (
                    <Chip
                      size="small"
                      icon={<DarkModeOutlinedIcon sx={{ fontSize: "14px !important" }} />}
                      label={t("Draw.Dark")}
                      sx={{ position: "absolute", bottom: 4, right: 4, height: 22, fontSize: 10 }}
                    />
                  )}
                </Box>
              );
            })
          )}
        </Box>

        <Tooltip title={t("Draw.UploadImage")}>
          <span>
            <Button
              variant="outlined"
              disabled={!canAddMore || uploading}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                width: 56,
                height: 120,
                minWidth: 56,
                borderRadius: "12px",
                flexShrink: 0,
                alignSelf: "flex-start",
                mt: 0.5,
              }}
            >
              <CloudUploadOutlinedIcon />
            </Button>
          </span>
        </Tooltip>
        </Box>
      </Box>

      <WorkspaceHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

      {deleteItemOpen && selectedItem && (
        <OpsPageFormDeleteDialog
          deleteModalVisible
          deleteModalProps={{ info: t("DeleteModal.InfoWithName", { name: `#${selectedItem.id}` }) }}
          handleDeleteModalClose={() => setDeleteItemOpen(false)}
          handleDelete={() => {
            setDeleteItemOpen(false);
            void deleteItems([selectedItem.id]);
          }}
        />
      )}

      {/* Tümünü sil geri alınamaz; production gibi açık bir onay metniyle sorulur. */}
      {deleteAllOpen && (
        <OpsPageFormDeleteDialog
          deleteModalVisible
          deleteModalProps={{ title: t("Draw.DeleteAllWorkspaceItems"), info: t("Draw.DeleteAllWorkspaceItemsConfirmation") }}
          handleDeleteModalClose={() => setDeleteAllOpen(false)}
          handleDelete={() => {
            setDeleteAllOpen(false);
            void deleteItems((allItems ?? []).map((item) => item.id));
          }}
        />
      )}

      <WorkspaceUnitPicker
        open={
          polygonPickerOpen &&
          selectedPolygonIndex != null &&
          (canAssignUnit || isMinimap || isStage)
        }
        mode="bind"
        units={projectUnits}
        current={selectedPolygonUnit}
        tours={workspaceTours}
        currentTour={selectedPolygonTour}
        currentSceneId={selectedPolygonSceneId}
        infoCards={workspaceInfoCards}
        currentInfoCard={selectedPolygonInfoCard}
        currentUrl={selectedPolygonUrl}
        blocks={stageBlocks}
        currentBlock={selectedPolygonBlock}
        currentNavKind={selectedNavKind}
        projectId={projectId}
        entityType={entityType}
        entityId={entityId}
        allowUnits={canAssignUnit}
        allowTours={(isMinimap || isStage) && canAssignTour}
        allowInfoCards={isStage && canAssignInfoCard}
        allowUrl={isMinimap || isStage}
        allowBlocks={isStage && canAssignBlock}
        allowProject={isStage}
        allowNone={isStage}
        presentationType={presentationType}
        onClose={() => {
          setPolygonPickerOpen(false);
          setSelectedPolygonIndex(null);
        }}
        onSelect={handleAssignUnit}
        onSelectTour={handleAssignTour}
        onSelectInfoCard={handleAssignInfoCard}
        onSelectUrl={handleAssignUrl}
        onSelectBlock={handleAssignBlock}
        onSelectProject={handleAssignProject}
        onClear={handleClearUnit}
        onUnitUpdated={handleUnitUpdated}
      />

      <WorkspaceUnitPicker
        open={unitEditDrawerOpen}
        mode="edit"
        units={projectUnits}
        current={selectedPolygonUnit}
        projectId={projectId}
        onClose={() => setUnitEditDrawerOpen(false)}
        onUnitUpdated={handleUnitUpdated}
      />

      <DrawEditorDialog item={editing} open={Boolean(editing)} onClose={() => setEditing(null)} onSave={handleSave} />

      <WorkspaceJsonDrawer
        open={jsonOpen}
        polygons={selectedItem?.polygons}
        onClose={() => setJsonOpen(false)}
        onApply={handleApplyJson}
      />

      <Dialog open={compassOpen} onClose={() => setCompassOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t("Draw.CompassDegree")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("Draw.CompassDegreeDescription")}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label={t("Draw.CompassDegreeValue")}
            value={compassValue}
            onChange={(event) => setCompassValue(Number(event.target.value))}
            inputProps={{ min: 0, max: 360 }}
            helperText={t("Draw.CompassDegreeHelperText")}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompassOpen(false)}>{t("Draw.Cancel")}</Button>
          <Button variant="contained" onClick={() => void handleSaveCompass()}>
            {t("Draw.Save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
