import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormTrigger } from "react-hook-form";

export interface IReactHookFormProps {
  register: UseFormRegister<any>;
  control: Control<any, any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  trigger?: UseFormTrigger<any>;
}
