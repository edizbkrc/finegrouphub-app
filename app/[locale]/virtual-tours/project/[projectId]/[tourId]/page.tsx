"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, CircularProgress } from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsLayout from "@layout/OpsLayout";
import OpsLayoutContent from "@layout/OpsLayoutContent";
import NotFoundComponent from "@components/NotFoundComponent";
import VirtualTourPage from "@features/virtualtour/components/VirtualTourPage";
import { VirtualTourEntityTypeEnum } from "@features/virtualtour/types/VirtualTourEntityTypeEnum";
import { ProjectEndpoint } from "@features/project/helpers/ProjectEndpoint";
import type { IVirtualTourData } from "@features/virtualtour/types/IVirtualTourData";
import JSONbig from "json-bigint";

/** Mevcut turu yükleyip sahne düzenleyicisini açar. */
export default function VirtualTourDetailPage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string; tourId: string }>;
}) {
  const { locale, projectId, tourId } = use(params);
  const t = useTranslations();
  const projectNum = Number(projectId);
  const [apiData, setApiData] = useState<IVirtualTourData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axiosInstance
      .get(ApiRoutes.VirtualTourDetail, {
        params: {
          VirtualTourId: tourId,
          EntityId: projectNum,
          EntityType: VirtualTourEntityTypeEnum.Project,
        },
        withoutToast: true,
        transformResponse: [
          (data: string) => {
            const parsed = JSON.parse(data);
            const big = JSONbig.parse(data);
            if (parsed?.data?.id !== undefined) parsed.data.id = String(big.data.id);
            return parsed;
          },
        ],
      })
      .then((res) => {
        if (!res?.data?.isSuccess || !res.data.data) {
          setError(true);
          return;
        }
        setApiData(res.data.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [tourId, projectNum]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const backHref = `/${locale}${ProjectEndpoint.ProjectVirtualTours(projectNum)}`;

  if (error || !apiData) {
    return (
      <OpsLayout>
        <OpsLayoutContent>
          <NotFoundComponent backHref={backHref} />
        </OpsLayoutContent>
      </OpsLayout>
    );
  }

  const name = apiData.translations?.[0]?.name || t("Form.VirtualTour");

  return (
    <VirtualTourPage
      projectId={projectNum}
      entityId={projectNum}
      entityType={VirtualTourEntityTypeEnum.Project}
      virtualId={String(apiData.id)}
      apiData={apiData}
      name={name}
    />
  );
}
