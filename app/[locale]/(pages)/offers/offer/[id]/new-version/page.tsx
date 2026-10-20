import { ApiRoutes } from "@network/ApiRoutes";
import OpsLayoutContent from "@layout/OpsLayoutContent";
import OpsPageFetcher from "@common/page/OpsPageFetcher";
import NewVersionOffer from "@/features/offer/NewVersionOffer";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <OpsLayoutContent>
      <OpsPageFetcher url={ApiRoutes.OfferDetail} params={{ offerId: decodeURIComponent(id) }}>
        <NewVersionOffer />
      </OpsPageFetcher>
    </OpsLayoutContent>
  );
}
