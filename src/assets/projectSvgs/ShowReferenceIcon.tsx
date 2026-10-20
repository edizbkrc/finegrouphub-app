import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function ShowReferenceIcon(props: SvgIconProps) {
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
          d="M24.3412 16.0001L19.7035 11.3623L15.0658 16.0001V0.98584H7.65876C6.77387 0.98584 5.92522 1.33736 5.2995 1.96308C4.67379 2.58879 4.32227 3.43744 4.32227 4.32234V27.6778C4.32227 28.5627 4.67379 29.4113 5.2995 30.0371C5.92522 30.6628 6.77387 31.0143 7.65876 31.0143H24.3412C25.2261 31.0143 26.0748 30.6628 26.7005 30.0371C27.3262 29.4113 27.6777 28.5627 27.6777 27.6778V4.32234C27.6777 3.43744 27.3262 2.58879 26.7005 1.96308C26.0748 1.33736 25.2261 0.98584 24.3412 0.98584V16.0001Z"
          fill="#71758D"
        />
      </svg>
    </SvgIcon>
  );
}
