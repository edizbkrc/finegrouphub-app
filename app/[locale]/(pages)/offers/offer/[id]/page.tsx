import { ApiRoutes } from "@network/ApiRoutes";
import OpsLayoutContent from "@layout/OpsLayoutContent";
import OpsPageFetcher from "@common/page/OpsPageFetcher";
import OfferDetail from "@/features/offer/OfferDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <OpsLayoutContent>
      <OpsPageFetcher url={ApiRoutes.OfferDetail} params={{ offerId: decodeURIComponent(id) }}>
        <OfferDetail />
      </OpsPageFetcher>
    </OpsLayoutContent>
  );
}
