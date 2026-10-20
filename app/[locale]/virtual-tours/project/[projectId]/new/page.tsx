"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import VirtualTourPage from "@features/virtualtour/components/VirtualTourPage";
import { VirtualTourEntityTypeEnum } from "@features/virtualtour/types/VirtualTourEntityTypeEnum";

/** Yeni proje sanal turu — ilk kayıtta API turu oluşturur. */
export default function NewVirtualTourPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const t = useTranslations();
  const id = Number(projectId);

  return (
    <VirtualTourPage
      projectId={id}
      entityId={id}
      entityType={VirtualTourEntityTypeEnum.Project}
      name={t("Form.Project")}
    />
  );
}
