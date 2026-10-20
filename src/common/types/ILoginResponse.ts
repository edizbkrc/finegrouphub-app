import { ILoginSystemInfo } from "@/types/ILoginSystemInfo";
import { IMenuItem } from "./IMenuItem";
import { IMilvaToken } from "./IMilvaToken";
import { IPageDto } from "./IPageDto";

export interface ILoginResponse {
  id: number;
  token: IMilvaToken;
  accessibleMenuItems: IMenuItem[];
  pageInformations: IPageDto[];
  /**
   * Ne .NET ne de Laravel API'si login yanıtında `systemInfo` döndürüyor
   * (kaynakta hiç üretilmiyor); yalnızca referans istemci tipinde vardı.
   * Kilit ekranı ve para birimi bu yüzden varsayılan davranışta kalır.
   */
  systemInfo?: ILoginSystemInfo;
}
