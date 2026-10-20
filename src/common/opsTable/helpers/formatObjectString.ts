export function formatObject(obj: any, format: string) {
  return format.replace(/\{(\w+(\.\w+)*)\}/g, (match, path) => {
    let keys = path.split(".");
    let value = obj;

    for (let key of keys) {
      value = value?.[key];
      if (value === undefined) {
        return "";
      }
    }

    return value;
  });
}
