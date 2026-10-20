import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function ProposalTextIcon(props: SvgIconProps) {
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
          d="M20.6436 22.1924L14.4519 28.3841H29.9312V22.1924H20.6436ZM16.0927 8.55505L2.06836 22.5794V28.3841H7.87313L21.8974 14.3598L16.0927 8.55505ZM26.3865 9.8708C26.9902 9.2671 26.9902 8.26095 26.3865 7.68821L22.7643 4.06603C22.4743 3.77773 22.0819 3.61591 21.673 3.61591C21.264 3.61591 20.8717 3.77773 20.5817 4.06603L17.749 6.89876L23.5537 12.7035L26.3865 9.8708Z"
          fill="#71758D"
        />
      </svg>
    </SvgIcon>
  );
}
