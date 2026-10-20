import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import type { IAutoSelectItem } from "@components/AsyncAutocomplete";
import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";

type SetLoading = (loading: boolean) => void;
type SetOptions = (values: unknown[]) => void;

/**
 * Dil seçici: genel `PATCH /v1/Lookups` ucuna (entityName "Language") güvenmek
 * yerine `getOptions` kaçış kapısıyla doğrudan `/v1/languages`'tan besleniyor —
 * TenantForm'daki çözümün aynısı (bkz. docs/API_ADAPTER.md §7). Lookups ucu
 * Language varlığını desteklemezse form boş dropdown'la kalmasın diye.
 */
export const getLanguageOptions = (setLoading: SetLoading, setOptions: SetOptions) => {
  setLoading(true);
  axiosInstance
    .patch(ApiRoutes.Languages, { pageNumber: 1, rowCount: 50 }, { withoutToast: true })
    .then((response) => {
      if (!response.data?.isSuccess) return;
      const options: IAutoSelectItem[] = (response.data.data as { id: number; name: string }[]).map((language) => ({
        id: language.id,
        title: language.name,
      }));
      setOptions(options);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
};

/**
 * Durum güncelleme çekmecesindeki proje seçici. Referansta `Lookups` +
 * `FineProject` varlığıyla besleniyordu; Laravel LookupService bu varlığı
 * tanımıyor, bu yüzden firmanın projeleri `PATCH /v1/projects` listesinden
 * `TenantId` filtresiyle çekiliyor.
 */
export const getTenantProjectOptions =
  (tenantId: string | undefined) => (setLoading: SetLoading, setOptions: SetOptions) => {
    if (!tenantId) return;

    setLoading(true);
    axiosInstance
      .patch(
        ApiRoutes.Projects,
        {
          pageNumber: 1,
          rowCount: 1000,
          filtering: { criterias: [{ filterBy: "TenantId", value: tenantId, type: FilterTypeEnum.EqualTo }] },
        },
        { withoutToast: true }
      )
      .then((response) => {
        if (!response.data?.isSuccess) return;
        const options: IAutoSelectItem[] = (response.data.data as { id: number; name: string }[]).map((project) => ({
          id: project.id,
          title: project.name,
        }));
        setOptions(options);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
