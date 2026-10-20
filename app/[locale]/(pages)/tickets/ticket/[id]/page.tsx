import { ApiRoutes } from "@network/ApiRoutes";
import OpsLayoutContent from "@layout/OpsLayoutContent";
import OpsPageFetcher from "@common/page/OpsPageFetcher";
import TicketDetailForm from "@forms/TicketDetailForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <OpsLayoutContent>
      <OpsPageFetcher url={ApiRoutes.TicketDetail} params={{ ticketId: decodeURIComponent(id) }}>
        <TicketDetailForm />
      </OpsPageFetcher>
    </OpsLayoutContent>
  );
}
