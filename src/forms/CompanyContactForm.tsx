"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import { AutoSelect, TelInput } from "@common/inputs";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormCustomComponent } from "@common/types/IFormCustomComponent";

interface ICompanyContactFormProps extends IFormCustomComponent {
  /** Sekme içindeyse dış kart/başlık basılmaz — yalnızca satırlar + ekle. */
  embedded?: boolean;
}

/**
 * Firma iletişim kişileri (`contactInfo.contacts[]`).
 *
 * Kişi listesi hem yerel state'te hem react-hook-form'da tutulur: dizi her
 * değişimde `setValue` ile TEK parça yazılır (API `contactInfo`'yu bütün bir
 * nesne olarak güncelliyor), alan bazlı `register` ise yalnızca doğrulama içindir.
 */
export default function CompanyContactForm({ apiData, formState, embedded }: ICompanyContactFormProps) {
  const t = useTranslations();
  // Özel bileşenlerde `OpsPageFormGenerator`'ın kullandığı "Form" ad alanlı çevirici
  // gerekiyor: AutoSelect/TelInput etiketi `t(formItem.label)` ile çözer ve etiketler
  // "Form." önekisiz yazılır.
  const tf = useTranslations("Form");
  const { control, errors, setValue, register } = formState || {};
  const formErrors = errors as any;
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    const initialContacts = apiData?.contactInfo?.contacts ?? [];
    if (initialContacts.length > 0) {
      setContacts(initialContacts);
      initialContacts.forEach((contact: any, index: number) => {
        setValue?.(`contactInfo.contacts.${index}`, contact);
      });
    } else {
      // API, oluşturmada en az bir kişi istiyor (CreateTenantValidator: contacts zorunlu).
      setContacts([{ nameSurname: "" }]);
    }
  }, [apiData, setValue]);

  const updateFormValue = (updated: any[]) => {
    setContacts(updated);
    setValue?.("contactInfo.contacts", updated, { shouldDirty: true });
  };

  const handleChange = (index: number, field: string, value: any) => {
    updateFormValue(contacts.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleAddContact = () => updateFormValue([...contacts, { nameSurname: "" }]);

  const handleRemoveContact = (index: number) => {
    const updated = contacts.filter((_, i) => i !== index);
    // Referansta boş kalınca `type: ""` içeren dolu bir satır konuyordu; API `type`
    // için geçerli enum bekliyor, "" gönderimi 400 döner. Boş satır sadece adı taşır.
    updateFormValue(updated.length === 0 ? [{ nameSurname: "" }] : updated);
  };

  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        {!embedded ? (
          <Typography variant="subtitle1" fontWeight={700}>
            {t("Tenant.ContactInfo")}
          </Typography>
        ) : (
          <span />
        )}
        <Button variant="contained" size="small" onClick={handleAddContact} startIcon={<Add />}>
          {t("Button.Add")}
        </Button>
      </Stack>

      {contacts.map((contact, index) => (
        <Box key={index}>
          {index > 0 && <Divider sx={{ mb: 2 }} />}
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" color="text.secondary">
                {t("Tenant.ContactInfoIndex", { index: index + 1 })}
              </Typography>
              {index > 0 && (
                <Button variant="text" color="error" size="small" onClick={() => handleRemoveContact(index)}>
                  {t("Button.Remove")}
                </Button>
              )}
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label={tf("NameSurname")}
                placeholder={tf("PlaceHolderValue", { value: tf("NameSurname") })}
                fullWidth
                value={contact?.nameSurname || ""}
                error={!!formErrors?.contactInfo?.contacts?.[index]?.nameSurname}
                helperText={formErrors?.contactInfo?.contacts?.[index]?.nameSurname?.message}
                {...register?.(`contactInfo.contacts.${index}.nameSurname`, {
                  required: tf("Required"),
                  maxLength: { value: 70, message: tf("MaxLength", { max: 70 }) },
                })}
                onChange={(e) => handleChange(index, "nameSurname", e?.target?.value)}
              />
              <TextField
                label={tf("Email")}
                placeholder={tf("PlaceHolderValue", { value: tf("Email") })}
                type="email"
                fullWidth
                value={contact?.email || ""}
                error={!!formErrors?.contactInfo?.contacts?.[index]?.email}
                helperText={formErrors?.contactInfo?.contacts?.[index]?.email?.message}
                {...register?.(`contactInfo.contacts.${index}.email`, {
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: tf("CorrectEmail") },
                })}
                onChange={(e) => handleChange(index, "email", e.target.value)}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TelInput
                  control={control}
                  defaultValue={contact.phoneNumber}
                  register={register as any}
                  setValue={setValue as any}
                  t={tf}
                  variant="outlined"
                  error={!!formErrors?.contactInfo?.contacts?.[index]?.phoneNumber}
                  errorMessage={formErrors?.contactInfo?.contacts?.[index]?.phoneNumber?.message}
                  formItem={{
                    name: `contactInfo.contacts.${index}.phoneNumber`,
                    label: "Phone",
                    type: FormItemTypeEnum.PHONE,
                    visibility: FormItemVisibilityEnum.Both,
                    onChange: (_data, val) => handleChange(index, "phoneNumber", val),
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <AutoSelect
                  // key: kişi silinince index kayar; AutoSelect'in iç `selected` state'i
                  // eski kişinin tipini taşımasın diye tip değeri anahtara dahil edilir.
                  key={`contact-type-${index}-${contact?.type ?? "none"}`}
                  control={control}
                  defaultValue={contact?.type ? { id: contact.type, title: t(`ContactType.${contact.type}`) } : null}
                  register={register as any}
                  setValue={setValue as any}
                  t={tf}
                  variant="outlined"
                  error={!!formErrors?.contactInfo?.contacts?.[index]?.type}
                  errorMessage={formErrors?.contactInfo?.contacts?.[index]?.type?.message}
                  formItem={{
                    name: `contactInfo.contacts.${index}.type`,
                    label: "ContactType",
                    type: FormItemTypeEnum.AUTO_COMPLETE,
                    visibility: FormItemVisibilityEnum.Both,
                    onChange: (_data, val) => handleChange(index, "type", val),
                    registerOptions: { required: tf("Required") },
                    placeholder: tf("PlaceHolderValue", { value: tf("ContactType") }),
                    autoCompleteProps: { enumName: "ContactType" },
                  }}
                />
              </Box>
            </Stack>

            <TextField
              label={tf("Note")}
              placeholder={tf("PlaceHolderValue", { value: tf("Note") })}
              fullWidth
              multiline
              rows={2}
              value={contact.note || ""}
              error={!!formErrors?.contactInfo?.contacts?.[index]?.note}
              helperText={formErrors?.contactInfo?.contacts?.[index]?.note?.message}
              onChange={(e) => handleChange(index, "note", e.target.value)}
            />
          </Stack>
        </Box>
      ))}

    </Stack>
  );
}
