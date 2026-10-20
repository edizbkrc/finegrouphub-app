import { notFound } from "next/navigation";

/**
 * next-intl catch-all: locale altındaki eşleşmeyen yollar Next'in yerleşik
 * global 404'üne düşmesin, `app/[locale]/not-found.tsx` render edilsin diye.
 */
export default function CatchAllPage() {
  notFound();
}
