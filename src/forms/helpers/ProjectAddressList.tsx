"use client";

import CompanyAddressList from "./CompanyAddressList";
import type { IFormCustomComponent } from "@common/types/IFormCustomComponent";

interface IProjectAddressListProps extends IFormCustomComponent {
  maxAddresses?: number;
}

/** Proje detayındaki `projectAddresses` alanı. */
export default function ProjectAddressList({ apiData, formState, maxAddresses = 5 }: IProjectAddressListProps) {
  return (
    <CompanyAddressList
      apiData={apiData}
      formState={formState}
      formKey="projectAddresses"
      maxAddresses={maxAddresses}
      requireAtLeastOne={false}
      titleKey="Form.AddressInfo"
      indexTitleKey="Form.AddressInfoWithIndex"
    />
  );
}
