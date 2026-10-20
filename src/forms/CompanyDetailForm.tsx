"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import { usePageAction } from "@hooks/usePageAction";
import { usePageInformation } from "@hooks/usePageInformation";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import OpsPageForm from "@common/page/OpsPageForm";
import { Box, Button, Chip, Divider, Grid, Stack, Tooltip, Typography } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import TuneIcon from "@mui/icons-material/Tune";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { InfoOutlined } from "@mui/icons-material";
import { Routes } from "@enums/Routes";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";
import MultiArrayObjectInput from "@common/inputs/MultiArrayObjectInput";
import CompanyContactAddressTabs from "./helpers/CompanyContactAddressTabs";
import CompanyGeneralInfoEditDialog from "./helpers/CompanyGeneralInfoEditDialog";
import CompanyMainDrawer from "./CompanyMainDrawer";
import TennatTransactionHistory from "./TennatTransactionHistory";
import { getLanguageOptions } from "./helpers/companyHelpers";

const CARD_SX = {
  borderRadius: "16px",
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow: (theme: { palette: { mode: string } }) =>
    `0 8px 24px ${theme.palette.mode === "light" ? "rgba(15, 23, 42, 0.05)" : "none"}`,
} as const;

const URL_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-./?%&=]*)?$/;
const ICON_SX = { width: 22, height: 22 };

function CompanyInfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      sx={{ py: 1.25 }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      {typeof value === "string" || typeof value === "number" || !value ? (
        <Tooltip title={value ?? ""} arrow disableHoverListener={!value}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            textAlign="right"
            color={value ? "text.primary" : "text.disabled"}
            sx={{ minWidth: 0 }}
          >
            {value || "—"}
          </Typography>
        </Tooltip>
      ) : (
        value
      )}
    </Stack>
  );
}

/** Firma (tenant) detay + düzenleme sayfası. */
export default function CompanyDetailForm({ data, reFetch }: { data?: any; reFetch?: () => void }) {
  const t = useTranslations();
  const tForm = useTranslations("Form");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [transactionVisible, setTransactionVisible] = useState(false);
  const [generalEditOpen, setGeneralEditOpen] = useState(false);
  const pageInfo = usePageInformation(OpsPageNames.TenantManagement);
  const canEdit = !!(pageInfo?.hasEdit && pageInfo?.userCanEdit);
  const canUpdateStatus = usePageAction(OpsPageNames.TenantManagement, "UpdateTenantState");

  const yesNoChip = (active: boolean) => (
    <Chip
      size="small"
      label={active ? t("Form.Yes") : t("Form.No")}
      color={active ? "success" : "error"}
      sx={{ fontWeight: 600, minWidth: 64 }}
    />
  );

  const generalRows: { label: string; value?: ReactNode }[] = [
    { label: t("Form.IsActive"), value: yesNoChip(!!data?.isActive) },
    { label: t("Form.WasServiceProvided"), value: yesNoChip(!!data?.serviceProvided) },
    { label: t("Form.TenancyName"), value: data?.fullCompanyName },
    { label: t("Login.TennantId"), value: data?.id },
    { label: t("Form.MainLanguage"), value: data?.languageName },
    { label: t("Form.MainCurrency"), value: data?.mainCurrencyDescription },
    {
      label: t("Form.SubscriptionExpireDate"),
      value: data?.subscriptionExpireDate ? getLocalizedMoment(data.subscriptionExpireDate).format("LL") : undefined,
    },
    { label: t("Form.InitialUserPassword"), value: data?.initialUserPassword },
  ];

  const schema: IOpsPageFormItem[] = [
    {
      name: t("Tenant.Generalnfo"),
      renderComponent: (apiData, formState) => (
        <Grid
          size={{ xs: 12, lg: 3 }}
          sx={{ display: "flex", flexDirection: "column", gap: 4, alignSelf: "stretch" }}
        >
          <Box sx={CARD_SX}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ px: 2, pt: 2, pb: 0.5 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoOutlined color="primary" sx={ICON_SX} />
                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {t("Tenant.Generalnfo")}
                </Typography>
              </Stack>
              {canEdit && (
                <Button
                  size="small"
                  variant="contained"
                  disableElevation
                  startIcon={<EditOutlinedIcon />}
                  onClick={() => setGeneralEditOpen(true)}
                  data-cy="company-general-edit"
                >
                  {t("Button.Edit")}
                </Button>
              )}
            </Stack>
            <Stack divider={<Divider flexItem />} sx={{ px: 2, pt: 0.5, pb: 1 }}>
              {generalRows.map((row) => (
                <CompanyInfoRow key={row.label} label={row.label} value={row.value} />
              ))}
            </Stack>
          </Box>

          {/* Satırdaki diğer kartlar daha uzun; kalan boşluk notlara verilir. */}
          <Box sx={{ ...CARD_SX, flex: 1, minHeight: 260, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2, pt: 2, pb: 1 }}>
              <NotesOutlinedIcon color="primary" sx={ICON_SX} />
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                {t("Form.Notes")}
              </Typography>
            </Stack>
            <Box sx={{ px: 2, pb: 2, flex: 1, minHeight: 0, overflow: "auto" }}>
              <MultiArrayObjectInput
                formItem={{
                  name: "notes",
                  label: "Notes",
                  type: FormItemTypeEnum.MultiArrayObjectInput,
                  visibility: FormItemVisibilityEnum.Both,
                  registerOptions: { maxLength: { value: 2500, message: t("Form.MaxLength", { max: 2500 }) } },
                }}
                register={formState!.register}
                setValue={formState!.setValue}
                control={formState!.control}
                t={tForm}
                apiData={apiData}
                isEdit
                variant="outlined"
                defaultValue={apiData?.notes ?? []}
              />
            </Box>
          </Box>
        </Grid>
      ),
      renderComponentVisiblitity: FormItemVisibilityEnum.Both,
    },
    {
      gridSize: { xs: 12, lg: 5 },
      multiSchema: [
        {
          name: t("Tenant.TenantInfo"),
          icon: <BusinessOutlinedIcon color="primary" sx={ICON_SX} />,
          schema: [
            {
              name: "fullCompanyName",
              label: "FullBusinessName",
              type: FormItemTypeEnum.TEXT,
              visibility: FormItemVisibilityEnum.Both,
              registerOptions: {
                required: t("Form.Required"),
                maxLength: { value: 200, message: t("Form.MaxLength200") },
              },
            },
            {
              name: "name",
              label: "CompanyDisplayName",
              type: FormItemTypeEnum.TEXT,
              visibility: FormItemVisibilityEnum.Both,
              registerOptions: {
                required: t("Form.Required"),
                // Referansta mesaj MaxLength200'dü ama sınır 100 idi (API de 100) — mesaj düzeltildi.
                maxLength: { value: 100, message: t("Form.MaxLength100") },
              },
            },
            {
              name: "managerNameSurname",
              label: "ManagerNameSurname",
              type: FormItemTypeEnum.TEXT,
              visibility: FormItemVisibilityEnum.Both,
              registerOptions: {
                required: t("Form.Required"),
                maxLength: { value: 70, message: t("Form.MaxLength70") },
              },
            },
            {
              name: "managerIdentityNumber",
              label: "MIdentityNumber",
              type: FormItemTypeEnum.TEXT,
              visibility: FormItemVisibilityEnum.Both,
              registerOptions: { maxLength: { value: 20, message: t("Form.MaxLength", { max: 20 }) } },
            },
          ],
        },
        {
          name: t("Tenant.TaxAndContactInfo"),
          icon: <ReceiptLongOutlinedIcon color="primary" sx={ICON_SX} />,
          schema: [
            {
              name: "taxNo",
              label: "TaxNo",
              type: FormItemTypeEnum.TEXT,
              visibility: FormItemVisibilityEnum.Both,
              registerOptions: { maxLength: { value: 50, message: t("Form.MaxLength50") } },
            },
            {
              name: "taxOfficeName",
              label: "TaxOfficeName",
              type: FormItemTypeEnum.TEXT,
              visibility: FormItemVisibilityEnum.Both,
              registerOptions: { maxLength: { value: 100, message: t("Form.MaxLength100") } },
            },
            // `mainCurrency` düzenleme formunda YOK: UpdateTenantCommand'da bu alan bulunmuyor
            // (yalnızca oluşturmada belirlenir). Değer sol "Genel Bilgiler" kartında salt okunur gösterilir.
            {
              name: "languageId",
              label: "ContactLanguage",
              type: FormItemTypeEnum.AUTO_COMPLETE,
              visibility: FormItemVisibilityEnum.Both,
              autoCompleteProps: {
                getOptions: getLanguageOptions,
                getDefaultValue: (apiData) => {
                  const tenant = apiData as { languageId?: number | null; languageName?: string } | null;
                  return tenant?.languageId ? { id: tenant.languageId, title: tenant.languageName ?? "" } : null;
                },
              },
              registerOptions: { required: t("Form.Required") },
            },
            {
              name: "contactInfo.locationUrl",
              label: "LocationUrl",
              type: FormItemTypeEnum.TEXT,
              visibility: FormItemVisibilityEnum.Both,
              registerOptions: { pattern: { value: URL_PATTERN, message: t("Form.CorrectWebSite") } },
            },
            {
              name: "contactInfo.webSiteAddress",
              label: "WebSiteAddress",
              type: FormItemTypeEnum.TEXT,
              visibility: FormItemVisibilityEnum.Both,
              registerOptions: { pattern: { value: URL_PATTERN, message: t("Form.CorrectWebSite") } },
            },
          ],
        },
      ],
    },
    {
      gridSize: { xs: 12, lg: 4 },
      multiSchema: [
        {
          name: t("Form.UploadImage"),
          icon: <ImageOutlinedIcon color="primary" sx={ICON_SX} />,
          schema: [
            {
              name: "logo",
              visibility: FormItemVisibilityEnum.Both,
              type: FormItemTypeEnum.S3_IMAGE,
              label: "UploadLogo",
            },
          ],
        },
        {
          name: t("Form.UploadFile"),
          icon: <DescriptionOutlinedIcon color="primary" sx={ICON_SX} />,
          schema: [
            {
              name: "documents",
              visibility: FormItemVisibilityEnum.Both,
              type: FormItemTypeEnum.FILE,
              label: "Documents",
              fileMultiple: true,
            },
          ],
        },
        {
          name: t("Tenant.DisplayInfo"),
          icon: <TuneIcon color="primary" sx={ICON_SX} />,
          schema: [
            {
              name: "showInReferences",
              label: "ShowInReferences",
              type: FormItemTypeEnum.SWITCH,
              visibility: FormItemVisibilityEnum.Both,
              defaultValue: false,
              icon: <VisibilityOutlinedIcon color="primary" sx={ICON_SX} />,
            },
            {
              name: "featured",
              label: "Featured",
              type: FormItemTypeEnum.SWITCH,
              visibility: FormItemVisibilityEnum.Both,
              defaultValue: false,
              icon: <StarOutlineIcon color="primary" sx={ICON_SX} />,
            },
            {
              name: "pinned",
              label: "Pinned",
              type: FormItemTypeEnum.SWITCH,
              visibility: FormItemVisibilityEnum.Both,
              defaultValue: false,
              icon: <PushPinOutlinedIcon color="primary" sx={ICON_SX} />,
            },
          ],
        },
      ],
    },
    {
      name: t("Tenant.ContactInfo"),
      renderComponent: (apiData, formState) => (
        <Grid size={12}>
          <CompanyContactAddressTabs apiData={apiData} formState={formState} />
        </Grid>
      ),
      renderComponentVisiblitity: FormItemVisibilityEnum.Both,
    },
  ];

  /**
   * Güncelleme sonrası aynı sayfada kalınır; `OpsPageFetcher` verisini istemci
   * tarafında çektiği için `router.refresh()` işe yaramaz, `reFetch` kullanılır.
   */
  const succesCallback = () => reFetch?.();

  const renderRightHeader = () => (
    <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap", mt: 3 }}>
      {canUpdateStatus && (
        <Button
          variant="contained"
          color="tertiary"
          disableElevation
          sx={{ minWidth: ["100%", ""] }}
          onClick={() => setDrawerVisible(true)}
          startIcon={<AutorenewIcon />}
          size="large"
        >
          {t("Tenant.TenantStatusUpdate")}
        </Button>
      )}
      <Button
        variant="outlined"
        color="tertiary"
        disableElevation
        sx={{ minWidth: ["100%", ""] }}
        onClick={() => setTransactionVisible(true)}
        startIcon={<InfoOutlined />}
        size="large"
      >
        {t("Form.TransactionHistory")}
      </Button>
    </Stack>
  );

  /**
   * API `contactInfo`'yu TEK parça nesne olarak güncelliyor ve `contacts`/`addresses`
   * boş olamıyor (UpdateTenantValidator). Formda yalnızca dokunulan alanlar dolu
   * geleceğinden eksik parçalar mevcut API verisiyle tamamlanır; hiçbiri değişmediyse
   * `contactInfo` hiç gönderilmez.
   */
  const manipulateFormData = (apiData: Record<string, any>, formData: Record<string, any>) => {
    const newFormData = { ...formData };

    const apiContactInfo = apiData?.contactInfo || {};
    const formContactInfo = formData?.contactInfo || {};

    const hasContacts = !!formContactInfo.contacts;
    const hasAddresses = !!formContactInfo.addresses;
    const locationUnchanged = apiContactInfo.locationUrl === formContactInfo.locationUrl;
    const websiteUnchanged = apiContactInfo.webSiteAddress === formContactInfo.webSiteAddress;

    if (!hasContacts && !hasAddresses && locationUnchanged && websiteUnchanged) {
      delete newFormData.contactInfo;
      return newFormData;
    }

    newFormData.contactInfo = {
      contacts: hasContacts ? formContactInfo.contacts : apiContactInfo.contacts,
      addresses: hasAddresses ? formContactInfo.addresses : apiContactInfo.addresses,
      locationUrl: formContactInfo.locationUrl !== undefined ? formContactInfo.locationUrl : apiContactInfo.locationUrl,
      webSiteAddress:
        formContactInfo.webSiteAddress !== undefined ? formContactInfo.webSiteAddress : apiContactInfo.webSiteAddress,
    };

    return newFormData;
  };

  return (
    <>
      <OpsPageForm
        data={data}
        schema={schema}
        pageHeaderProps={{
          goBackRouteName: Routes.Companies,
          title: t("Modal.CompanyCreate"),
          editTitle: data?.name || t("Modal.CompanyDetail"),
          renderAdditionalHeader: renderRightHeader,
        }}
        endpoint={ApiRoutes.CompanyDetail}
        succesCallback={succesCallback}
        pageName={OpsPageNames.TenantManagement}
        manipulateFormData={manipulateFormData}
      />

      {drawerVisible && (
        <CompanyMainDrawer
          isOpen={drawerVisible}
          handleClose={(isRefresh) => {
            setDrawerVisible(false);
            if (isRefresh) reFetch?.();
          }}
          data={data}
        />
      )}

      {transactionVisible && (
        <TennatTransactionHistory
          isOpen={transactionVisible}
          handleClose={() => setTransactionVisible(false)}
          data={data}
        />
      )}

      <CompanyGeneralInfoEditDialog
        open={generalEditOpen}
        data={data}
        onClose={() => setGeneralEditOpen(false)}
        onSaved={() => reFetch?.()}
      />
    </>
  );
}
