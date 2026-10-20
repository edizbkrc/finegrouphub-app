import type { ReactNode } from "react";
import type { ApiRoutes } from "@network/ApiRoutes";
import type { IOpsTableService } from "../opsTable/types/IOpsTableService";
import type { IFormCustomComponent } from "./IFormCustomComponent";
import type { IFormItem } from "./IFormItem";
import type { IOpsFormSharedProps } from "./IOpsFormSharedProps";
import type { IReactHookFormProps } from "./IReactHookFormProps";

export interface IOpsFormProps extends IOpsFormSharedProps {
  url?: ApiRoutes;
  opsService?: IOpsTableService<any>;
  scheme: IFormItem[];
  succesCallback?: () => void;
  customSubmit?: (formData: any, setSubmitLoading: (submitLoading: boolean) => void) => void;
  pageName?: string;
  allowDetailRefetch?: boolean;
  getAddExtraData?: (formData?: any, apiData?: any) => Record<string, any> | undefined;
  getDeletedPropertyNames?: (formData?: any, apiData?: any) => string[] | null;
  lastDisabledRowId?: number;
  getDefaultValues?: (key: string, apiData: Record<string, any>) => Record<string, any> | null;
  submitButtonVisible?: boolean;
  manipulateFormData?: (apiData: Record<string, any>, formData: Record<string, any>) => Record<string, any>;
  /** Şema alanlarından sonra çizilen özel blok (madde listesi, sanal tur vb.). */
  renderExtra?: (apiData: IFormCustomComponent["apiData"], formState: IReactHookFormProps) => ReactNode;
}
