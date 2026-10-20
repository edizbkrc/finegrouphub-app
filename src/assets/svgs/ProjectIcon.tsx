import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function ProjectIcon(props: SvgIconProps) {
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
          d="M10 21V3M3 10H21M5.4 3H18.6C19.2365 3 19.847 3.25286 20.2971 3.70294C20.7471 4.15303 21 4.76348 21 5.4V18.6C21 19.2365 20.7471 19.847 20.2971 20.2971C19.847 20.7471 19.2365 21 18.6 21H5.4C4.76348 21 4.15303 20.7471 3.70294 20.2971C3.25286 19.847 3 19.2365 3 18.6V5.4C3 5.08483 3.06208 4.77274 3.18269 4.48156C3.3033 4.19038 3.48008 3.9258 3.70294 3.70294C4.15303 3.25286 4.76348 3 5.4 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
