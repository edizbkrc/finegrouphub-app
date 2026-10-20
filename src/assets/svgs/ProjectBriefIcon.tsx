import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

/** Proje ön süreci menü ikonu: not defteri / kontrol listesi. */
export default function ProjectBriefIcon(props: SvgIconProps) {
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
          d="M9 4H7C5.89543 4 5 4.89543 5 6V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V6C19 4.89543 18.1046 4 17 4H15M9 4V3.5C9 2.94772 9.44772 2.5 10 2.5H14C14.5523 2.5 15 2.94772 15 3.5V4M9 4V5.5C9 6.05228 9.44772 6.5 10 6.5H14C14.5523 6.5 15 6.05228 15 5.5V4M9 11H15M9 15H13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
