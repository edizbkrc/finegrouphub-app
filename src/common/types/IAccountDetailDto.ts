/**
 * `GET /v1/Account/detail?userId=` yanıtı.
 *
 * ⚠️ Referansta `useProfileInfo` hiç tanımlanmamış bir `IIAccountDetailDto`
 * (çift "I") tipine referans veriyordu; global scope'ta böyle bir tip yok.
 * `typescript.ignoreBuildErrors: true` olduğu için build patlamıyordu.
 */
export interface IAccountDetailDto {
  id: number;
  userName: string;
  name: string;
  surname: string;
  email: string | null;
  phoneNumber: string | null;
  userType: number;
  roleIdList: number[];
  allowedNotifications: number[];
}
