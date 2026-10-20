"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useDispatch } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import PlaceIcon from "@mui/icons-material/Place";
import SaveIcon from "@mui/icons-material/Save";
import * as MuiIcons from "@mui/icons-material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { setGeneralLoading } from "@redux/appSlice";
import OpsPageFormDeleteDialog from "@common/page/OpsPageFormDeleteDialog";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
import { useProject } from "@/features/project/ProjectContext";
import ProjectSection from "@/features/project/ProjectSection";
import ProjectMapForm, { type SavedMapMark } from "./ProjectMapForm";

const DEFAULT_CENTER = { latitude: 37.874641, longitude: 32.493156 };

export interface IMapMark {
  id: string;
  geoPoint: { latitude: number; longitude: number };
  emoji?: string | null;
  customIcon?: string | null;
  showLabel?: boolean;
  labelColor?: string | null;
  translations?: Array<{ name?: string; languageId?: number }>;
}

/** API camel/Pascal karışımı + customIcon’u normalize et. */
function normalizeMark(raw: any): IMapMark {
  const geo = raw?.geoPoint || raw?.GeoPoint || {};
  return {
    id: String(raw?.id || raw?.Id || ""),
    geoPoint: {
      latitude: Number(geo.latitude ?? geo.Latitude ?? 0),
      longitude: Number(geo.longitude ?? geo.Longitude ?? 0),
    },
    emoji: raw?.emoji ?? raw?.Emoji ?? null,
    customIcon: (raw?.customIcon || raw?.CustomIcon || null) as string | null,
    // Burada düşürülürse sürükle/kaydet ve silme PUT'ları etiket ayarını sessizce sıfırlar.
    showLabel: Boolean(raw?.showLabel ?? raw?.ShowLabel ?? false),
    labelColor: (raw?.labelColor ?? raw?.LabelColor ?? null) as string | null,
    translations: raw?.translations || raw?.Translations || [],
  };
}

interface MapInfo {
  geoPoint?: { latitude: number; longitude: number };
  zoom?: number;
  marks?: IMapMark[];
}

const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => <Box sx={{ height: "70vh", minHeight: 420, bgcolor: "action.hover" }} />,
});

function StockIcon({ name }: { name?: string | null }) {
  // Harita pin’leriyle aynı MUI çözümlemesi (resolveMuiIconName).
  const componentName = (name || "place")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const Icon = ((MuiIcons as Record<string, typeof PlaceIcon>)[componentName] as typeof PlaceIcon) || PlaceIcon;
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: "2px solid",
        borderColor: "primary.main",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
        flexShrink: 0,
      }}
    >
      <Icon sx={{ fontSize: 16 }} color="primary" />
    </Box>
  );
}

/** Proje haritası — prod hub pin ikonları + özel ikon yükleme. */
export default function ProjectMapScreen() {
  const t = useTranslations();
  const dispatch = useDispatch();
  const { projectId, project, reload } = useProject();
  const { currentLanguage } = useSupportedLanguages();
  const initialMap = (project?.mapInfo as MapInfo | undefined) || {};

  const [geoPoint, setGeoPoint] = useState(initialMap.geoPoint || DEFAULT_CENTER);
  const [zoom, setZoom] = useState(initialMap.zoom || 12);
  const [marks, setMarks] = useState<IMapMark[]>(() => (initialMap.marks || []).map(normalizeMark));
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [pendingPoint, setPendingPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const info = (project?.mapInfo as MapInfo | undefined) || {};
    setGeoPoint(info.geoPoint || DEFAULT_CENTER);
    setZoom(info.zoom || 12);
    const next = (info.marks || []).map(normalizeMark);
    // Sunucu customIcon’u düşürürse yerel kopyayı koru (F5 dışı anlık kayıplar).
    setMarks((prev) =>
      next.map((m) => {
        if (m.customIcon) return m;
        const old = prev.find((p) => p.id === m.id);
        return old?.customIcon ? { ...m, customIcon: old.customIcon } : m;
      })
    );
    setDirty(false);
  }, [project?.mapInfo]);

  // Haritada pin tıklanınca sağ listede o satırı seçili göster + görünür alana kaydır.
  useEffect(() => {
    if (!selectedId) return;
    const el = itemRefs.current[selectedId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  const mapInfoSnapshot: MapInfo = useMemo(
    () => ({ geoPoint, zoom, marks }),
    [geoPoint, zoom, marks]
  );

  const markLabel = useCallback(
    (m: IMapMark) => {
      const byLang = m.translations?.find((tr) => tr.languageId === currentLanguage?.id);
      return byLang?.name || m.translations?.[0]?.name || m.id.slice(0, 8);
    },
    [currentLanguage?.id]
  );

  // MapCanvas kalıcı etiket için çözülmüş adı ister; memo, Leaflet ikonlarının her
  // render'da yeniden kurulmasını önler.
  const canvasMarks = useMemo(() => marks.map((m) => ({ ...m, name: markLabel(m) })), [marks, markLabel]);

  const onMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!adding) return;
      setAdding(false);
      setFormData(null);
      setPendingPoint({ latitude: lat, longitude: lng });
      setFormOpen(true);
    },
    [adding]
  );

  const openEdit = (marker: IMapMark) => {
    setFormData(marker);
    setPendingPoint({ latitude: marker.geoPoint.latitude, longitude: marker.geoPoint.longitude });
    setSelectedId(marker.id);
    setFormOpen(true);
  };

  const removeSelected = () => {
    if (!formData?.id) return;
    const next = marks.filter((m) => m.id !== formData.id);
    setMarks(next);
    setSelectedId(null);
    setDeleteOpen(false);
    setFormData(null);
    dispatch(setGeneralLoading(true));
    axiosInstance
      .put(ApiRoutes.ProjectDetail, {
        id: projectId,
        mapInfo: { value: { ...mapInfoSnapshot, marks: next }, isUpdated: true },
      })
      .then((res) => {
        if (res?.data?.isSuccess) reload();
      })
      .finally(() => dispatch(setGeneralLoading(false)));
  };

  const save = async () => {
    dispatch(setGeneralLoading(true));
    try {
      const res = await axiosInstance.put(ApiRoutes.ProjectDetail, {
        id: projectId,
        mapInfo: { value: { geoPoint, zoom, marks }, isUpdated: true },
      });
      if (res?.data?.isSuccess) {
        setDirty(false);
        reload();
      }
    } finally {
      dispatch(setGeneralLoading(false));
    }
  };

  const selected = marks.find((m) => m.id === selectedId) || null;

  return (
    <ProjectSection
      title={t("Modal.ProjectMapView")}
      right={
        <Stack direction="row" spacing={1}>
          <Button
            variant={adding ? "contained" : "outlined"}
            startIcon={<AddIcon />}
            onClick={() => {
              setAdding((v) => !v);
              setSelectedId(null);
              setFormData(null);
            }}
            disableElevation
            data-cy="map-add-toggle"
          >
            {adding ? t("Button.Cancel") : t("Form.AddPoint")}
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={!dirty} disableElevation data-cy="map-save">
            {t("Button.Save")}
          </Button>
        </Stack>
      }
    >
      {adding && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("Form.MapClickToAddHint")}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <Box
            sx={{
              height: "70vh",
              minHeight: 420,
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: 1,
            }}
          >
            <MapCanvas
              center={geoPoint}
              zoom={zoom}
              marks={canvasMarks}
              selectedId={selectedId}
              adding={adding}
              onMapClick={onMapClick}
              onMarkerClick={setSelectedId}
              onMarkerDrag={(id, lat, lng) => {
                setMarks((prev) =>
                  prev.map((m) => (m.id === id ? { ...m, geoPoint: { latitude: lat, longitude: lng } } : m))
                );
                setDirty(true);
              }}
              onZoomChange={(z) => {
                setZoom(z);
                setDirty(true);
              }}
              onCenterChange={(lat, lng) => {
                setGeoPoint({ latitude: lat, longitude: lng });
                setDirty(true);
              }}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 3 }}>
          <Paper
            sx={{
              p: 2,
              height: { xs: "auto", lg: "70vh" },
              minHeight: { lg: 420 },
              maxHeight: { xs: "50vh", lg: "70vh" },
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            elevation={0}
            variant="outlined"
          >
            <Stack spacing={2} sx={{ flexShrink: 0 }}>
              <TextField
                label={t("Form.Latitude")}
                type="number"
                value={geoPoint.latitude}
                onChange={(e) => {
                  setGeoPoint((prev) => ({ ...prev, latitude: Number(e.target.value) }));
                  setDirty(true);
                }}
                fullWidth
                size="small"
              />
              <TextField
                label={t("Form.Longitude")}
                type="number"
                value={geoPoint.longitude}
                onChange={(e) => {
                  setGeoPoint((prev) => ({ ...prev, longitude: Number(e.target.value) }));
                  setDirty(true);
                }}
                fullWidth
                size="small"
              />
              <TextField
                label="Zoom"
                type="number"
                value={zoom}
                onChange={(e) => {
                  setZoom(Number(e.target.value));
                  setDirty(true);
                }}
                fullWidth
                size="small"
              />

              <Typography variant="subtitle2" fontWeight={700}>
                {t("Form.Markers")}
              </Typography>
            </Stack>

            <Box ref={listScrollRef} sx={{ flex: 1, minHeight: 0, overflowY: "auto", mt: 1, pr: 0.5 }}>
              {marks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  —
                </Typography>
              ) : (
                <List dense disablePadding>
                  {marks.map((m) => (
                    <ListItemButton
                      key={m.id}
                      ref={(node) => {
                        itemRefs.current[m.id] = node as unknown as HTMLDivElement | null;
                      }}
                      selected={selectedId === m.id}
                      onClick={() => {
                        setSelectedId(m.id);
                        openEdit(m);
                      }}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        border: "1px solid",
                        borderColor: selectedId === m.id ? "primary.main" : "transparent",
                        bgcolor: selectedId === m.id ? "action.selected" : "transparent",
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {m.customIcon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.customIcon}
                            alt=""
                            width={28}
                            height={28}
                            style={{
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "2px solid",
                              borderColor: selectedId === m.id ? "#FF6A00" : "#FF6A00",
                            }}
                          />
                        ) : (
                          <StockIcon name={m.emoji} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {markLabel(m)}
                          </Typography>
                        }
                        secondary={`${m.geoPoint.latitude.toFixed(5)}, ${m.geoPoint.longitude.toFixed(5)}`}
                      />
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(m);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(m);
                            setDeleteOpen(true);
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </ListItemButton>
                  ))}
                </List>
              )}

              {selected && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  {markLabel(selected)}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {formOpen && (
        <ProjectMapForm
          projectId={projectId}
          mapInfo={mapInfoSnapshot}
          isOpen={formOpen}
          data={formData}
          selectedGeoPoint={pendingPoint}
          handleClose={(refresh, savedMarks?: SavedMapMark[]) => {
            setFormOpen(false);
            setPendingPoint(null);
            setFormData(null);
            if (refresh) {
              if (savedMarks) {
                setMarks(savedMarks);
                setDirty(false);
              }
              reload();
            }
          }}
        />
      )}

      {deleteOpen && formData && (
        <OpsPageFormDeleteDialog
          deleteModalVisible
          deleteModalProps={{
            title: t("DeleteModal.Title"),
            info: t("DeleteModal.InfoWithName", { name: markLabel(formData) }),
          }}
          handleDeleteModalClose={() => setDeleteOpen(false)}
          handleDelete={removeSelected}
        />
      )}
    </ProjectSection>
  );
}
