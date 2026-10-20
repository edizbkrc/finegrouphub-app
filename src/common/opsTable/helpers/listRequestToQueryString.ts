import { IListRequest } from "@common/types/IListRequest";
import queryString from "query-string";

export function listRequestToQueryString(request: IListRequest): string {
  const queryStringObject: Record<string, any> = {
    pageNumber: request.pageNumber,
    rowCount: request.rowCount,
  };

  if (request.filtering) {
    queryStringObject.filtering = JSON.stringify(request.filtering);
  }

  if (request.sorting) {
    queryStringObject.sorting = JSON.stringify(request.sorting);
  }

  if (request.aggregation) {
    queryStringObject.aggregation = JSON.stringify(request.aggregation);
  }

  return queryString.stringify(queryStringObject, {
    skipNull: true,
    skipEmptyString: true,
  });
}
