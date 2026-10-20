import OfferPreview from "@/features/offer/OfferPreview";

export default async function Page({ params }: { params: Promise<{ correlationId: string; offerId: string }> }) {
  const { correlationId, offerId } = await params;
  return <OfferPreview correlationId={decodeURIComponent(correlationId)} offerId={decodeURIComponent(offerId)} />;
}
