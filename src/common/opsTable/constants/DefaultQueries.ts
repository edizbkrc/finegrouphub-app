import { listRequestToQueryString } from "@opsTable/helpers/listRequestToQueryString";
import { SortTypeEnum } from "@common/enums/SortTypeEnum";
import { IListRequest } from "@common/types/IListRequest";

export const SortCreationDateDesc: IListRequest = {
  pageNumber: 1,
  rowCount: 10,
  sorting: {
    sortBy: "CreationDate",
    type: SortTypeEnum.Des,
  },
};

export const SortCreationDateDescString =
  listRequestToQueryString(SortCreationDateDesc);
