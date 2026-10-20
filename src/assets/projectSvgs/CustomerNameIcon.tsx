import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function CustomerNameIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16.0007 12C18.578 12 20.6673 9.91068 20.6673 7.33335C20.6673 4.75602 18.578 2.66669 16.0007 2.66669C13.4233 2.66669 11.334 4.75602 11.334 7.33335C11.334 9.91068 13.4233 12 16.0007 12Z"
          fill="#71758D"
          stroke="#71758D"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.66699 27.3334C2.66699 21.442 8.03966 16.6667 14.667 16.6667"
          stroke="#71758D"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20.6667 28L27.3333 21.3334L24.6667 18.6667L18 25.3334V28H20.6667Z"
          fill="#71758D"
          stroke="#71758D"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
