"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsPageForm from "@common/page/OpsPageForm";
import { OpsPageNames } from "@enums/OpsPageNames";
import { Routes } from "@enums/Routes";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";
import type { IAutoSelectItem } from "@components/AsyncAutocomplete";

interface IUserFormProps {
  data?: {
    id?: number;
    name?: string;
    surname?: string;
    roles?: { id: number; name: string }[];
    userType?: number;
  };
}

/**
 * Rol seçici: `PATCH /v1/Lookups` (genel entity lookup) API'de henüz yok
 * (bkz. docs/API_ADAPTER.md §6). Geçici olarak `Roles` liste ucundan
 * `getOptions` ile besleniyor — jenerik Lookups ucu gelince
 * `lookUpParams: { entityName: "Role", requestedPropertyNames: ["Name"] }`'a
 * dönülmeli.
 */
const getRoleOptions = (
  setLoading: (loading: boolean) => void,
  setOptions: (values: unknown[]) => void
) => {
  setLoading(true);
  axiosInstance
    .patch(ApiRoutes.Roles, { pageNumber: 1, rowCount: 1000 }, { withoutToast: true })
    .then((response) => {
      if (!response.data?.isSuccess) return;
      const options: IAutoSelectItem[] = (response.data.data as { id: number; name: string }[]).map(
        (role) => ({ id: role.id, title: role.name })
      );
      setOptions(options);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
};

export default function UserForm({ data }: IUserFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const schema: IOpsPageFormItem[] = [
    {
      name: t("Modal.PersonalInfo"),
      schema: [
        {
          name: "name",
          visibility: FormItemVisibilityEnum.Both,
          type: FormItemTypeEnum.TEXT,
          label: "Name",
          registerOptions: {
            required: t("Form.Required"),
            maxLength: { value: 70, message: t("Form.MaxLength", { max: 70 }) },
          },
        },
        {
          name: "surname",
          visibility: FormItemVisibilityEnum.Both,
          type: FormItemTypeEnum.TEXT,
          label: "Surname",
          registerOptions: {
            maxLength: { value: 70, message: t("Form.MaxLength", { max: 70 }) },
          },
        },
      ],
    },
    {
      name: t("Modal.LoginInfo"),
      schema: [
        {
          name: "email",
          visibility: FormItemVisibilityEnum.Both,
          type: FormItemTypeEnum.EMAIL,
          label: "Email",
        },
        {
          name: "userName",
          visibility: FormItemVisibilityEnum.Both,
          type: FormItemTypeEnum.TEXT,
          label: "Username",
          registerOptions: {
            required: t("Form.Required"),
            maxLength: { value: 250, message: t("Form.MaxLength", { max: 250 }) },
          },
        },
        {
          name: "password",
          label: "Password",
          // Referansta TEXT idi → tarayıcı parolayı düz metin gösteriyordu (B51).
          // HTML input type="password" ile eşleşen değer için native maskeleme.
          type: FormItemTypeEnum.Password,
          visibility: FormItemVisibilityEnum.Add,
          registerOptions: {
            required: t("Form.Required"),
            minLength: { value: 6, message: t("Form.PasswordMinLength") },
            maxLength: { value: 50, message: t("Form.MaxLength", { max: 50 }) },
            validate: {
              hasUpperCase: (value: unknown) => /[A-Z]/.test(String(value)) || t("Form.PasswordHasUpperCase"),
              hasLowerCase: (value: unknown) => /[a-z]/.test(String(value)) || t("Form.PasswordHasLowerCase"),
              hasNumber: (value: unknown) => /\d/.test(String(value)) || t("Form.PasswordHasNumber"),
              hasSpecialChar: (value: unknown) =>
                /[!@#$%^&*(),.?":{}|<>]/.test(String(value)) || t("Form.PasswordHasSymbol"),
            },
          },
        },
      ],
    },
    {
      name: t("Modal.PositionInfo"),
      schema: [
        {
          name: "userType",
          label: "UserType",
          type: FormItemTypeEnum.AUTO_COMPLETE,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: { required: t("Form.Required") },
          autoCompleteProps: {
            enumName: "UserType",
            getDefaultValue: (apiData) => {
              const value = (apiData as IUserFormProps["data"])?.userType;
              return value ? { id: value, title: t(`UserType.${value}`) } : null;
            },
          },
        },
        {
          name: "roleIdList",
          label: "Position",
          type: FormItemTypeEnum.AUTO_COMPLETE,
          visibility: FormItemVisibilityEnum.Both,
          registerOptions: { required: t("Form.Required") },
          autoCompleteProps: {
            isMultiple: true,
            getOptions: getRoleOptions,
            getDefaultValue: (apiData) =>
              (apiData as IUserFormProps["data"])?.roles?.map((role) => ({ id: role.id, title: role.name })) ?? null,
          },
        },
      ],
    },
  ];

  const succesCallback = (id: unknown) => {
    router.push(`/${locale}${Routes.User}/${id}`);
  };

  return (
    <OpsPageForm
      data={data}
      schema={schema}
      pageName={OpsPageNames.UserManagement}
      endpoint={ApiRoutes.UserDetail}
      succesCallback={succesCallback}
      deletePropertyName="UserId"
      lastDisabledRowId={4999}
      pageHeaderProps={{
        title: t("Modal.PersonelCreate"),
        editTitle: `${data?.name ?? ""} ${data?.surname ?? ""}`.trim(),
        goBackRouteName: Routes.Users,
      }}
    />
  );
}
