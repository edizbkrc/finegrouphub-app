import { ApiRoutes } from "@network/ApiRoutes";
import OpsLayoutContent from "@layout/OpsLayoutContent";
import OpsPageFetcher from "@common/page/OpsPageFetcher";
import SubOrderForm from "@forms/SubOrderForm";

/** Üst siparişi (id) çeker; proje kimliği (`[projectId]`) form içinde güncel özellikleri okumak için kullanılır. */
export default async function Page({ params }: { params: Promise<{ id: string; projectId: string }> }) {
  const { id } = await params;

  return (
    <OpsLayoutContent>
      <OpsPageFetcher url={ApiRoutes.OrderDetail} params={{ orderId: decodeURIComponent(id) }}>
        <SubOrderForm />
      </OpsPageFetcher>
    </OpsLayoutContent>
  );
}
