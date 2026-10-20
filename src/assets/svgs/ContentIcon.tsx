import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function ContentIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="22"
        height="20"
        viewBox="0 0 22 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.5 4H18C19.414 4 20.121 4 20.56 4.44C21 4.878 21 5.585 21 7V14C21 15.414 21 16.121 20.56 16.56C20.121 17 19.414 17 18 17H17.5M4.5 4H4C2.586 4 1.879 4 1.44 4.44C1 4.878 1 5.585 1 7V14C1 15.414 1 16.121 1.44 16.56C1.878 17 2.585 17 4 17H4.5M13.5 6H8.5M13.5 10H8.5M13.5 14H8.5M17.5 15V5C17.5 3.114 17.5 2.172 16.914 1.586C16.328 1 15.386 1 13.5 1H8.5C6.614 1 5.672 1 5.086 1.586C4.5 2.172 4.5 3.114 4.5 5V15C4.5 16.886 4.5 17.828 5.086 18.414C5.672 19 6.614 19 8.5 19H13.5C15.386 19 16.328 19 16.914 18.414C17.5 17.828 17.5 16.886 17.5 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
