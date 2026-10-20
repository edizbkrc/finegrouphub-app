import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { ThemeOptionsEnum } from "@common/enums/ThemeOptionsEnum";
import type { ILanguageDto } from "@common/types/ILanguageDto";
import type { IAppReducer } from "./IAppReducer";

const initialState: IAppReducer = {
  theme: ThemeOptionsEnum.LIGHT,
  opsModalVisible: false,
  opsModalData: null,
  generalLoading: false,
  languageLoading: true,
  languages: [],
  showMainFrame: false,
  errorMessages: {
    tr: "Beklenmedik bir hata oluştu lütfen daha sonra tekrar deneyiniz! Sorun çözülmez ise yetkililer ile iletişime geçiniz...",
    en: "An unexpected error occurred, please try again later! If the problem is not solved, contact the authorities...",
  },
  connectionErrorMessages: {
    tr: "İnternet bağlantınız yok. Lütfen bağlantınızı kontrol edin.",
    en: "You have no internet connection. Please check your connection.",
  },
};

export const appSlice = createSlice({
  name: "appReducer",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeOptionsEnum>) => {
      state.theme = action.payload;
    },
    setOpsModalVisible: (state, action: PayloadAction<boolean>) => {
      state.opsModalVisible = action.payload;
    },
    setOpsModalData: (state, action: PayloadAction<any>) => {
      state.opsModalData = action.payload;
    },
    setGeneralLoading: (state, action: PayloadAction<boolean>) => {
      state.generalLoading = action.payload;
    },
    setLanguageLoading: (state, action: PayloadAction<boolean>) => {
      state.languageLoading = action.payload;
    },
    setLanguages: (state, action: PayloadAction<ILanguageDto[]>) => {
      state.languages = action.payload;
    },
    setShowMainFrame: (state, action: PayloadAction<boolean>) => {
      state.showMainFrame = action.payload;
    },
  },
});

export const {
  setTheme,
  setOpsModalVisible,
  setOpsModalData,
  setGeneralLoading,
  setLanguageLoading,
  setLanguages,
  setShowMainFrame,
} = appSlice.actions;

export default appSlice.reducer;
