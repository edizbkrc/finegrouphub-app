import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function OrderIcon(props: SvgIconProps) {
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
          d="M8.23764 3.75H4.53516C3.98287 3.75 3.53516 4.19772 3.53516 4.75V20.75C3.53516 21.3023 3.98287 21.75 4.53516 21.75H19.4641C20.0164 21.75 20.4641 21.3023 20.4641 20.75V4.75C20.4641 4.19772 20.0164 3.75 19.4641 3.75H15.7616M6.35665 17.25H17.6426M8.23764 5.25H15.7616L16.7021 2.25H7.29715L8.23764 5.25ZM8.23764 15L11.0591 14.25L16.7021 9.75L14.8211 8.25L9.17814 12.75L8.23764 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
