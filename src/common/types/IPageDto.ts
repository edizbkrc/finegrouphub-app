interface AdditionalAction {
  id: number;
  title: string;
  actionName: string;
  url: string;
  isAction: boolean;
}

export interface IPageDto {
  id: number;
  name: string;
  localizedName: string;
  hasCreate: boolean;
  hasDetail: boolean;
  hasEdit: boolean;
  hasDelete: boolean;
  userCanCreate: boolean;
  userCanDetail: boolean;
  userCanEdit: boolean;
  userCanDelete: boolean;
  additionalActions: AdditionalAction[];
}
