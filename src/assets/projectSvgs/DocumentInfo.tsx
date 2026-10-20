import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function DocumentInfo(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="32"
        height="33"
        viewBox="0 0 32 33"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.9998 4.24951L25.3332 11.5828V26.9162C25.3332 27.6495 24.7332 28.2495 23.9998 28.2495H7.99984C7.2665 28.2495 6.6665 27.6495 6.6665 26.9162V5.58285C6.6665 4.84951 7.2665 4.24951 7.99984 4.24951H17.9998Z"
          fill="#BFC1CC"
          stroke="#71758D"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.3335 5.91626V11.9163H25.3335L19.3335 5.91626Z"
          stroke="#71758D"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
