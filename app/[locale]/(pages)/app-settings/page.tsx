import { ApiRoutes } from "@network/ApiRoutes";
import OpsLayoutContent from "@layout/OpsLayoutContent";
import OpsPageFetcher from "@common/page/OpsPageFetcher";
import AppSettingsForm from "@forms/AppSettingsForm";

export default function Page() {
  return (
    <OpsLayoutContent>
      <OpsPageFetcher url={ApiRoutes.AppSettings} params={{}}>
        <AppSettingsForm />
      </OpsPageFetcher>
    </OpsLayoutContent>
  );
}
