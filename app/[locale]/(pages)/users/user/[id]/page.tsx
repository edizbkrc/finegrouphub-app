import { ApiRoutes } from "@network/ApiRoutes";
import OpsLayoutContent from "@layout/OpsLayoutContent";
import OpsPageFetcher from "@common/page/OpsPageFetcher";
import UserForm from "@forms/UserForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = decodeURIComponent(id);

  return (
    <OpsLayoutContent>
      <OpsPageFetcher url={ApiRoutes.UserDetail} params={{ UserId: userId }}>
        <UserForm />
      </OpsPageFetcher>
    </OpsLayoutContent>
  );
}
