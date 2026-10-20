"use client";

import { use } from "react";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsPageFetcher from "@common/page/OpsPageFetcher";
import InfoCardForm from "@forms/project/InfoCardForm";

/** Bilgi kartı düzenleme — detay API'den çekilir. */
export default function EditInfoCardPage({ params }: { params: Promise<{ infoCardId: string }> }) {
  const { infoCardId } = use(params);
  const id = Number(decodeURIComponent(infoCardId));

  return (
    <OpsPageFetcher url={ApiRoutes.InfoCardDetail} params={{ InfoCardId: id }}>
      <InfoCardForm />
    </OpsPageFetcher>
  );
}
