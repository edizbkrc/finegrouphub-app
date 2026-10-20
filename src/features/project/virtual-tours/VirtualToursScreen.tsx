"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useDispatch } from "react-redux";
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { setGeneralLoading } from "@redux/appSlice";
import OpsIconButton from "@components/OpsIconButton";
import OpsPageFormDeleteDialog from "@common/page/OpsPageFormDeleteDialog";
import { useProject } from "@/features/project/ProjectContext";
import ProjectSection from "@/features/project/ProjectSection";
import { ProjectEndpoint } from "@/features/project/helpers/ProjectEndpoint";
import { VirtualTourEntityTypeEnum } from "@features/virtualtour/types/VirtualTourEntityTypeEnum";
import { useRouter } from "next/navigation";
import JSONbig from "json-bigint";

interface VirtualTourRow {
  id: number | string;
  name?: string;
  sceneCount?: number;
  translations?: Array<{ name?: string; languageId?: number }>;
}

function tourTitle(row: VirtualTourRow): string {
  return row.name || row.translations?.[0]?.name || `#${row.id}`;
}

/** Proje sanal tur listesi — karta tıklayınca düzenleyici açılır. */
export default function VirtualToursScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const dispatch = useDispatch();
  const { projectId } = useProject();
  const [list, setList] = useState<VirtualTourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VirtualTourRow | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosInstance
      .patch(
        ApiRoutes.VirtualTours,
        { pageNumber: 1, rowCount: 1000, entityId: projectId, entityType: VirtualTourEntityTypeEnum.Project },
        {
          withoutToast: true,
          transformResponse: [
            (data: string) => {
              const parsed = JSON.parse(data);
              const big = JSONbig.parse(data);
              if (Array.isArray(parsed?.data) && Array.isArray(big?.data)) {
                parsed.data = parsed.data.map((row: VirtualTourRow, index: number) => ({
                  ...row,
                  id: String(big.data[index]?.id ?? row.id),
                }));
              }
              return parsed;
            },
          ],
        }
      )
      .then((res) => {
        if (res?.data?.isSuccess) setList(res.data.data || []);
        else setError(t("Toast.Error"));
      })
      .catch(() => setError(t("Toast.Error")))
      .finally(() => setLoading(false));
  }, [projectId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (tour: VirtualTourRow) => {
    setDeleteTarget(null);
    dispatch(setGeneralLoading(true));
    try {
      const res = await axiosInstance.delete(ApiRoutes.VirtualTourDetail, {
        params: {
          VirtualTourId: tour.id,
          EntityId: projectId,
          EntityType: VirtualTourEntityTypeEnum.Project,
        },
      });
      if (res?.data?.isSuccess) load();
    } finally {
      dispatch(setGeneralLoading(false));
    }
  };

  return (
    <ProjectSection
      title={t("Form.ProjectVirtualTours")}
      onAdd={() => router.push(`/${locale}${ProjectEndpoint.VirtualTourCreate(projectId)}`)}
      addLabel={t("Button.Add")}
    >
      {loading && (
        <Stack alignItems="center" py={6}>
          <CircularProgress size={28} />
        </Stack>
      )}

      {!loading && error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("Project.SingleTourDayNightHint")}
        </Alert>
      )}

      {!loading && !error && list.length === 0 && (
        <Alert severity="info">{t("Project.NoVirtualTours")}</Alert>
      )}

      {deleteTarget && (
        <OpsPageFormDeleteDialog
          deleteModalVisible
          deleteModalProps={{ info: t("DeleteModal.InfoWithName", { name: tourTitle(deleteTarget) }) }}
          handleDeleteModalClose={() => setDeleteTarget(null)}
          handleDelete={() => handleDelete(deleteTarget)}
        />
      )}

      {!loading && list.length > 0 && (
        <Grid container spacing={2}>
          {list.map((tour) => (
            <Grid key={String(tour.id)} size={{ xs: 12, sm: 6, md: 4 }}>
              <TourCard
                tour={tour}
                href={`/${locale}${ProjectEndpoint.VirtualTourDetail(projectId, tour.id)}`}
                onDelete={() => setDeleteTarget(tour)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </ProjectSection>
  );
}

function TourCard({ tour, href, onDelete }: { tour: VirtualTourRow; href: string; onDelete: () => void }) {
  const t = useTranslations();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <Link href={href} prefetch style={{ textDecoration: "none", color: "inherit" }} data-cy={`virtual-tour-${tour.id}`}>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          height: 150,
          position: "relative",
          overflow: "hidden",
          borderRadius: "12px",
          cursor: "pointer",
          transition: "border-color .2s ease, box-shadow .2s ease",
          "&:hover": { borderColor: "primary.main", boxShadow: 2 },
        }}
      >
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          onClick={(event) => event.stopPropagation()}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <List dense>
            <ListItemButton component={Link} href={href} data-cy={`virtual-tour-edit-${tour.id}`}>
              <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                <EditIcon />
              </ListItemIcon>
              <ListItemText primary={t("Form.EditVirtualTour")} />
            </ListItemButton>
            <ListItemButton
              data-cy={`virtual-tour-delete-${tour.id}`}
              onClick={(event) => {
                event.preventDefault();
                setAnchorEl(null);
                onDelete();
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                <DeleteOutlineIcon />
              </ListItemIcon>
              <ListItemText primary={t("Form.Delete")} />
            </ListItemButton>
          </List>
        </Popover>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, position: "relative", zIndex: 2 }}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, maxWidth: "70%" }}>
            {tourTitle(tour)}
          </Typography>
          <OpsIconButton
            size="small"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setAnchorEl(event.currentTarget);
            }}
            data-cy={`virtual-tour-menu-${tour.id}`}
          >
            <MoreVertIcon />
          </OpsIconButton>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ position: "relative", zIndex: 1 }}>
          {t("Form.SceneCount")}: {tour.sceneCount ?? 0}
        </Typography>

        <Box sx={{ position: "absolute", top: -30, right: -50, opacity: 0.9 }}>
          <Image src="/svgs/workspace.svg" alt="" width={230} height={230} unoptimized />
        </Box>
      </Paper>
    </Link>
  );
}
