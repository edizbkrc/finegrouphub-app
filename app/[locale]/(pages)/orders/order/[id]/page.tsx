import { ApiRoutes } from "@network/ApiRoutes";
import OpsLayoutContent from "@layout/OpsLayoutContent";
import OpsPageFetcher from "@common/page/OpsPageFetcher";
import OrderDetail from "@/features/order/OrderDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <OpsLayoutContent>
      <OpsPageFetcher url={ApiRoutes.OrderDetail} params={{ orderId: decodeURIComponent(id) }}>
        <OrderDetail />
      </OpsPageFetcher>
    </OpsLayoutContent>
  );
}
