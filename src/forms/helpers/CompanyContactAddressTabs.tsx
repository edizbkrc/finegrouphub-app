"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Box, Paper, Tab, Tabs } from "@mui/material";
import type { IFormCustomComponent } from "@common/types/IFormCustomComponent";
import CompanyContactForm from "../CompanyContactForm";
import CompanyAddressList from "./CompanyAddressList";

type TabKey = "contacts" | "addresses";

/**
 * Firma detayında iletişim kişileri ve adresleri yan yana kart yerine
 * iki sekmede gösterir — “ne nerede” netleşsin diye.
 */
export default function CompanyContactAddressTabs({ apiData, formState }: IFormCustomComponent) {
  const t = useTranslations();
  const [tab, setTab] = useState<TabKey>("contacts");

  const contactCount = apiData?.contactInfo?.contacts?.length ?? 0;
  const addressCount = apiData?.contactInfo?.addresses?.length ?? 0;

  return (
    <Paper
      variant="outlined"
      sx={{ width: "100%", borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}
    >
      <Tabs
        value={tab}
        onChange={(_, value: TabKey) => setTab(value)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: "divider", minHeight: 48 }}
      >
        <Tab
          value="contacts"
          label={
            <Badge badgeContent={contactCount || null} color="primary" sx={{ "& .MuiBadge-badge": { right: -12 } }}>
              {t("Tenant.ContactInfo")}
            </Badge>
          }
          data-cy="company-tab-contacts"
        />
        <Tab
          value="addresses"
          label={
            <Badge badgeContent={addressCount || null} color="primary" sx={{ "& .MuiBadge-badge": { right: -12 } }}>
              {t("Tenant.AddressInfo")}
            </Badge>
          }
          data-cy="company-tab-addresses"
        />
      </Tabs>

      {/* Her iki panel mount kalır — sekme değişince local state / dirty form kaybolmasın. */}
      <Box sx={{ p: { xs: 2, md: 3 }, display: tab === "contacts" ? "block" : "none" }}>
        <CompanyContactForm apiData={apiData} formState={formState} embedded />
      </Box>
      <Box sx={{ p: { xs: 2, md: 3 }, display: tab === "addresses" ? "block" : "none" }}>
        <CompanyAddressList apiData={apiData} formState={formState} embedded />
      </Box>
    </Paper>
  );
}
