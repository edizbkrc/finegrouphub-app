import { store } from "@redux/store";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { localStorageService } from "../Common/localStorageService";

export const getConnectionErrorMessage = (): string => {
  const lang = localStorageService.getItem(LocalStorageKeysEnum.Language);
  const langCode = lang === "tr" ? "tr" : "en";

  return (
    store.getState().AppReducer?.connectionErrorMessages?.[langCode] ||
    "You have no internet connection. Please check your connection."
  );
};
