import moment from "moment";
import "moment/locale/tr";
import { localStorageService } from "../Common/localStorageService";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";

/** Aktif panel diline göre locale ayarlanmış moment nesnesi. */
export default function getLocalizedMoment(value?: moment.MomentInput) {
  const lang = localStorageService.getItem(LocalStorageKeysEnum.Language);
  return moment(value).locale(lang || "tr");
}

export function getLocalizedMomentCustomLang(
  value: moment.MomentInput,
  lang: string
) {
  return moment(value).locale(lang);
}
