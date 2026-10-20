import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function ContactFormIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_1775_55896)">
          <path
            d="M10.3468 8.84946L15.0726 12L19.7984 8.84946M4.04568 13.5753H6.14605M1.94531 10.4247H6.14605"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.14648 7.27417V6.74908C6.14648 6.19203 6.36777 5.65779 6.76167 5.2639C7.15556 4.87 7.6898 4.64871 8.24685 4.64871H21.8992C22.4563 4.64871 22.9905 4.87 23.3844 5.2639C23.7783 5.65779 23.9996 6.19203 23.9996 6.74908V17.2509C23.9996 17.808 23.7783 18.3422 23.3844 18.7361C22.9905 19.13 22.4563 19.3513 21.8992 19.3513H8.24685C7.6898 19.3513 7.15556 19.13 6.76167 18.7361C6.36777 18.3422 6.14648 17.808 6.14648 17.2509V16.7258"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_1775_55896">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </SvgIcon>
  );
}
