export function sortByPinned(data: any[]) {
  const dataCopy = [...data];

  return dataCopy?.sort((a, b) => {
    if (a.pinned && !b.pinned) {
      return -1; // a üstte olsun
    } else if (!a.pinned && b.pinned) {
      return 1; // b üstte olsun
    } else {
      return 0; // sıralama değişmesin
    }
  });
}
