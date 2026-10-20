import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function UnitTypeIcon(props: SvgIconProps) {
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
          d="M9.56425 14.4358H2.74414V21.2559H9.56425V14.4358Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.5131 2.25702L16.3846 10.5386H6.6416L11.5131 2.25702Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.3591 21.743C19.5115 21.743 21.2563 19.9982 21.2563 17.8458C21.2563 15.6934 19.5115 13.9486 17.3591 13.9486C15.2067 13.9486 13.4619 15.6934 13.4619 17.8458C13.4619 19.9982 15.2067 21.743 17.3591 21.743Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
