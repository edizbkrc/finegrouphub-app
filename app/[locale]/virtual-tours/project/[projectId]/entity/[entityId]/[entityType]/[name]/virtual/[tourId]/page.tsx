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

/** Entity sanal tur detayı. */
export default function EntityVirtualTourDetailPage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string; entityId: string; entityType: string; name: string; tourId: string }>;
}) {
  const { locale, projectId, entityId, entityType, name, tourId } = use(params);
  const t = useTranslations();
  const projectNum = Number(projectId);
  const entityNum = Number(entityId);
  const type = Number(entityType) as VirtualTourEntityTypeEnum;
  const [apiData, setApiData] = useState<IVirtualTourData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axiosInstance
      .get(ApiRoutes.VirtualTourDetail, {
        params: { VirtualTourId: tourId, EntityId: entityNum, EntityType: type },
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
  }, [tourId, entityNum, type]);

  const backHref =
    type === VirtualTourEntityTypeEnum.UnitTemplate
      ? `/${locale}${ProjectEndpoint.UnitTemplates(projectNum)}`
      : `/${locale}${ProjectEndpoint.ProjectVirtualTours(projectNum)}`;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !apiData) {
    return (
      <OpsLayout>
        <OpsLayoutContent>
          <NotFoundComponent backHref={backHref} />
        </OpsLayoutContent>
      </OpsLayout>
    );
  }

  const tourName = apiData.translations?.[0]?.name || decodeURIComponent(name) || t("Form.VirtualTour");

  return (
    <VirtualTourPage
      projectId={projectNum}
      entityId={entityNum}
      entityType={type}
      virtualId={String(apiData.id)}
      name={tourName}
      apiData={apiData}
    />
  );
}
