"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useDispatch } from "react-redux";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { setGeneralLoading } from "@redux/appSlice";
import OpsIconButton from "@components/OpsIconButton";
import OpsPageFormDeleteDialog from "@common/page/OpsPageFormDeleteDialog";
import { ProjectEndpoint } from "@/features/project/helpers/ProjectEndpoint";
import { VirtualTourEntityTypeEnum } from "@features/virtualtour/types/VirtualTourEntityTypeEnum";
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

/** Entity (proje / mülk şablonu) bazlı sanal tur listesi — form içi gömülü kullanım. */
export default function EntityVirtualTourList({
  projectId,
  entityId,
  entityType,
  entityName,
}: {
  projectId: number;
  entityId: number;
  entityType: VirtualTourEntityTypeEnum;
  entityName?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const dispatch = useDispatch();
  const [list, setList] = useState<VirtualTourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<VirtualTourRow | null>(null);

  const createHref = `/${locale}${ProjectEndpoint.VirtualTourEntityCreate(projectId, entityId, entityType, entityName || "tour")}`;

  const load = useCallback(() => {
    setLoading(true);
    axiosInstance
      .patch(
        ApiRoutes.VirtualTours,
        { pageNumber: 1, rowCount: 1000, entityId, entityType },
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
      })
      .finally(() => setLoading(false));
  }, [entityId, entityType]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (tour: VirtualTourRow) => {
    setDeleteTarget(null);
    dispatch(setGeneralLoading(true));
    try {
      const res = await axiosInstance.delete(ApiRoutes.VirtualTourDetail, {
        params: { VirtualTourId: tour.id, EntityId: entityId, EntityType: entityType },
      });
      if (res?.data?.isSuccess) load();
    } finally {
      dispatch(setGeneralLoading(false));
    }
  };

  return (
    <Stack spacing={2} sx={{ width: "100%", mt: 2 }} data-cy="entity-virtual-tour-list">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={700}>
          {t("Form.VirtualTours")}
        </Typography>
        <Button component={Link} href={createHref} variant="contained" size="small" startIcon={<AddIcon />}>
          {t("Button.Add")}
        </Button>
      </Stack>

      {loading && (
        <Stack alignItems="center" py={2}>
          <CircularProgress size={24} />
        </Stack>
      )}

      {!loading && list.length === 0 && <Alert severity="info">{t("Project.NoVirtualTours")}</Alert>}

      {deleteTarget && (
        <OpsPageFormDeleteDialog
          deleteModalVisible
          deleteModalProps={{ info: t("DeleteModal.InfoWithName", { name: tourTitle(deleteTarget) }) }}
          handleDeleteModalClose={() => setDeleteTarget(null)}
          handleDelete={() => handleDelete(deleteTarget)}
        />
      )}

      {!loading && list.length > 0 && (
        <Grid container spacing={1.5}>
          {list.map((tour) => {
            const href = `/${locale}${ProjectEndpoint.VirtualTourEntityDetail(projectId, entityId, entityType, entityName || "tour", tour.id)}`;
            return (
              <Grid key={String(tour.id)} size={{ xs: 12, sm: 6 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <Box component={Link} href={href} sx={{ textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" fontWeight={600} noWrap>
                      {tourTitle(tour)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("Form.SceneCount")}: {tour.sceneCount ?? 0}
                    </Typography>
                  </Box>
                  <OpsIconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(tour)}
                    aria-label={t("Form.Delete")}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </OpsIconButton>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}
