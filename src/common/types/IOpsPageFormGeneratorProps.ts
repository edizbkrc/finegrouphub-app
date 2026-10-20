import type { ILanguageDto } from "./ILanguageDto";
import type { IOpsPageFormItem } from "./IOpsPageFormItem";
import type { IOpsPageFormSharedHeader } from "./IOpsPageFormSharedHeader";

export interface IOpsPageFormGeneratorProps {
  children?: React.ReactNode;
  schema: IOpsPageFormItem[];
  apiData?: any;
  onSubmit: (data: any) => void;
  isEdit?: boolean;
  handleDelete?: () => void;
  languages: ILanguageDto[];
  pageHeaderProps?: IOpsPageFormSharedHeader;
}
