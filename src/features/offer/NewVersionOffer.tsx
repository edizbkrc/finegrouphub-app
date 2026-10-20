"use client";

import OfferForm from "@forms/OfferForm";
import type { IOfferDetail } from "./types";

/** OpsPageFetcher'ın enjekte ettiği önceki teklifi şablon olarak forma verir (form oluşturma modunda kalır). */
export default function NewVersionOffer({ data }: { data?: IOfferDetail }) {
  if (!data) return null;
  return <OfferForm template={data} />;
}
