export function updateQueryParams(queryString: string) {
  const currentUrl = new URL(window.location.href);
  currentUrl.search = queryString;

  window.history.replaceState({}, "", currentUrl.toString());
}
