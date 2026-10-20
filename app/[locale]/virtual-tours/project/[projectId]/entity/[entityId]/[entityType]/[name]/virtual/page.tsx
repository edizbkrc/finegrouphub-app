"use client";

import { use } from "react";
import VirtualTourPage from "@features/virtualtour/components/VirtualTourPage";
import { VirtualTourEntityTypeEnum } from "@features/virtualtour/types/VirtualTourEntityTypeEnum";

/** Entity (proje / mülk şablonu) için yeni sanal tur. */
export default function EntityVirtualTourCreatePage({
  params,
}: {
  params: Promise<{ projectId: string; entityId: string; entityType: string; name: string }>;
}) {
  const { projectId, entityId, entityType, name } = use(params);
  const type = Number(entityType) as VirtualTourEntityTypeEnum;

  return (
    <VirtualTourPage
      projectId={Number(projectId)}
      entityId={Number(entityId)}
      entityType={type}
      name={decodeURIComponent(name)}
    />
  );
}
