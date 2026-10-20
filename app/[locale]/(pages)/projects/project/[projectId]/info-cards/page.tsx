"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useDispatch } from "react-redux";
import { Button, Grid } from "@mui/material";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { setGeneralLoading } from "@redux/appSlice";
import OpsPageFormDeleteDialog from "@common/page/OpsPageFormDeleteDialog";
import NotFoundComponent from "@components/NotFoundComponent";
import { useProject } from "@/features/project/ProjectContext";
import ProjectSection from "@/features/project/ProjectSection";
import { ProjectEndpoint } from "@/features/project/helpers/ProjectEndpoint";
import InfoCardPreview, { type IInfoCardPreviewData } from "@/features/project/info-cards/InfoCardPreview";
import InfoCardListSkeleton from "@/features/project/info-cards/InfoCardListSkeleton";

/** Prod hub gibi görselli kart ızgarası; ekle/düzenle ayrı tam sayfa. */
export default function InfoCardsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const dispatch = useDispatch();
  const { projectId } = useProject();
  const [list, setList] = useState<IInfoCardPreviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<IInfoCardPreviewData | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    axiosInstance
      .patch(ApiRoutes.InfoCards, { pageNumber: 1, rowCount: 1000, projectId }, { withoutToast: true })
      .then((res) => {
        if (res?.data?.isSuccess) setList(res.data.data || []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = () => {
    if (!selected) return;
    dispatch(setGeneralLoading(true));
    axiosInstance
      .delete(ApiRoutes.InfoCardDetail, { params: { InfoCardId: selected.id } })
      .then((res) => {
        if (res?.data?.isSuccess) {
          setSelected(null);
          load();
        }
      })
      .finally(() => dispatch(setGeneralLoading(false)));
  };

  const sorted = [...list].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return (
    <ProjectSection
      title={t("Form.InfoCards")}
      right={
        <Button
          component={Link}
          href={`/${locale}${ProjectEndpoint.AddInfoCard(projectId)}`}
          variant="contained"
          disableElevation
          startIcon={<ControlPointIcon />}
          data-cy="info-card-add"
        >
          {t("Button.AddNew")}
        </Button>
      }
    >
      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        {loading ? (
          <InfoCardListSkeleton />
        ) : sorted.length > 0 ? (
          sorted.map((item) => (
            <InfoCardPreview key={item.id} data={item} projectId={projectId} onDelete={() => setSelected(item)} />
          ))
        ) : (
          <Grid size={12}>
            <NotFoundComponent />
          </Grid>
        )}
      </Grid>

      {selected && (
        <OpsPageFormDeleteDialog
          deleteModalVisible
          deleteModalProps={{
            title: t("DeleteModal.Title"),
            info: t("DeleteModal.InfoWithName", { name: selected.name || `#${selected.id}` }),
          }}
          handleDeleteModalClose={() => setSelected(null)}
          handleDelete={handleDelete}
        />
      )}
    </ProjectSection>
  );
}
