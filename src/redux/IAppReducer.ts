import { ThemeOptionsEnum } from "@common/enums/ThemeOptionsEnum";
import { ILanguageDto } from "@common/types/ILanguageDto";

export interface IAppReducer {
  theme: ThemeOptionsEnum;
  opsModalVisible: boolean;
  opsModalData?: any;
  generalLoading: boolean;
  languageLoading: boolean;
  languages: ILanguageDto[];
  showMainFrame: boolean;
  errorMessages: {
    tr: string;
    en: string;
  };
  connectionErrorMessages: {
    tr: string;
    en: string;
  };
}
