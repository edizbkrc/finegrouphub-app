import type { IReactHookFormProps } from "./IReactHookFormProps";

/**
 * `IOpsPageFormItem.renderComponent` ile çizilen özel form bileşenlerinin
 * (örn. CompanyContactForm) ortak props sözleşmesi.
 */
export interface IFormCustomComponent {
  apiData?: any;
  formState?: IReactHookFormProps;
}
