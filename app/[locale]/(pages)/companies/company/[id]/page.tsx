import { ApiRoutes } from "@network/ApiRoutes";
import OpsLayoutContent from "@layout/OpsLayoutContent";
import OpsPageFetcher from "@common/page/OpsPageFetcher";
import CompanyDetailForm from "@forms/CompanyDetailForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Tenant kimliği bileşik bir dize ("acme_1"); URL'den çözülüp `?tenantId=` olarak gider.
  const tenantId = decodeURIComponent(id);

  return (
    <OpsLayoutContent>
      <OpsPageFetcher url={ApiRoutes.CompanyDetail} params={{ tenantId }}>
        <CompanyDetailForm />
      </OpsPageFetcher>
    </OpsLayoutContent>
  );
}
