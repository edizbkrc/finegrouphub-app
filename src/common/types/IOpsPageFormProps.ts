import type { ApiRoutes } from "@network/ApiRoutes";
import type { IOpsPageFormItem } from "./IOpsPageFormItem";
import type { IOpsPageFormSharedHeader } from "./IOpsPageFormSharedHeader";

export interface IOpsPageFormProps {
  endpoint?: ApiRoutes;
  pageHeaderProps?: IOpsPageFormSharedHeader;
  data?: any;
  schema: IOpsPageFormItem[];
  succesCallback?: (data?: any) => void;
  errorCallback?: () => void;
  deletePropertyName?: string;
  deleteProcessCallback?: (type: "error" | "success") => void;
  deleteModalProps?: { title: string; info: string };
  customSubmit?: (formData: any, setSubmitLoading: (submitLoading: boolean) => void) => void;
  pageName?: string;
  addExtraData?: (formData?: any, apiData?: any) => Record<string, any> | undefined;
  getDeletedPropertyNames?: (formData?: any, apiData?: any) => string[] | null;
  lastDisabledRowId?: number;
  getDefaultValues?: (key: string, apiData: Record<string, any>) => Record<string, any> | null;
  manipulateFormData?: (apiData: Record<string, any>, formData: Record<string, any>) => Record<string, any>;
}
