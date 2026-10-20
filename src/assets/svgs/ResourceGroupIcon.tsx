import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function ResourceGroupIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 12C2 7.757 2 5.636 3.172 4.318C4.344 3 6.229 3 10 3H14C17.771 3 19.657 3 20.828 4.318C21.999 5.636 22 7.758 22 12C22 16.242 22 18.364 20.828 19.682C19.656 21 17.771 21 14 21H10C6.229 21 4.343 21 3.172 19.682C2.001 18.364 2 16.242 2 12Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 9H10M10 9C12.828 9 14.243 9 15.121 9.879C16 10.757 16 12.172 16 15V21M10 9V21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
