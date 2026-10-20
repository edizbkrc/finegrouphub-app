import { store } from "@redux/store";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { localStorageService } from "../Common/localStorageService";

export const getCommonErrorMessage = (): string => {
  const lang = localStorageService.getItem(LocalStorageKeysEnum.Language);
  const langCode = lang === "tr" ? "tr" : "en";

  return (
    store.getState().AppReducer?.errorMessages?.[langCode] ||
    "An unexpected error occurred, please try again later! If the problem is not solved, contact the authorities..."
  );
};
