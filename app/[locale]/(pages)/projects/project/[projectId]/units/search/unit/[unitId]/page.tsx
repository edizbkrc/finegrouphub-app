"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Alert, Button, CircularProgress, Stack } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import { useAppDispatch } from "@redux/hooks";
import { setOpsModalData, setOpsModalVisible } from "@redux/appSlice";
import { useOpsModal } from "@hooks/useOpsModal";
import { TableService } from "@opsTable/services/OpsTableServices";
import { useProject } from "@/features/project/ProjectContext";
import ProjectSection from "@/features/project/ProjectSection";
import { ProjectEndpoint } from "@/features/project/helpers/ProjectEndpoint";

const UnitForm = dynamic(() => import("@forms/project/UnitForm"));

const opsService = new TableService(ApiRoutes.Units, ApiRoutes.UnitDetail, "unitId");

/** Gelişmiş aramadan gelen mülk detayı — düzenleme modalını açar. */
export default function UnitSearchDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams<{ unitId: string }>();
  const searchParams = useSearchParams();
  const unitId = Number(params.unitId);
  const { projectId } = useProject();
  const dispatch = useAppDispatch();
  const { opsModalVisible } = useOpsModal();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const ref = searchParams.get("ref");
  const backHref =
    ref === "contactform"
      ? `/${locale}${Routes.ContactForms}`
      : `/${locale}${ProjectEndpoint.Project(projectId)}/units/search`;

  useEffect(() => {
    if (!unitId) return;
    setLoading(true);
    setError(false);
    axiosInstance
      .get(ApiRoutes.UnitDetail, { params: { UnitId: unitId }, withoutToast: true })
      .then((res) => {
        if (!res?.data?.isSuccess || !res.data.data) {
          setError(true);
          return;
        }
        dispatch(setOpsModalData(res.data.data));
        dispatch(setOpsModalVisible(true));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [unitId, dispatch]);

  return (
    <ProjectSection
      title={t("Form.UnitDetails")}
      right={
        <Button component={Link} href={backHref} variant="outlined" startIcon={<ArrowBack />} data-cy="unit-search-back">
          {t("Button.Back")}
        </Button>
      }
    >
      {loading && (
        <Stack alignItems="center" py={6}>
          <CircularProgress size={28} />
        </Stack>
      )}
      {!loading && error && <Alert severity="error">{t("Toast.Error")}</Alert>}
      {!loading && !error && !opsModalVisible && (
        <Alert severity="info">
          {t("Form.UnitDetails")} —{" "}
          <Button
            size="small"
            onClick={() => {
              axiosInstance.get(ApiRoutes.UnitDetail, { params: { UnitId: unitId } }).then((res) => {
                if (res?.data?.isSuccess) {
                  dispatch(setOpsModalData(res.data.data));
                  dispatch(setOpsModalVisible(true));
                }
              });
            }}
          >
            {t("Form.Edit")}
          </Button>
        </Alert>
      )}
      {opsModalVisible && <UnitForm opsService={opsService} projectId={projectId} />}
    </ProjectSection>
  );
}
