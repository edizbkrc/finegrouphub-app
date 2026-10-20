import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/** href verilmişse çocukları Link'e sarar, verilmemişse olduğu gibi bırakır. */
export default function LinkWraper({
  children,
  href,
  style,
}: {
  children: ReactNode;
  href?: string;
  style?: CSSProperties;
}) {
  if (!href) return <>{children}</>;

  return (
    <Link href={href} prefetch style={style}>
      {children}
    </Link>
  );
}
