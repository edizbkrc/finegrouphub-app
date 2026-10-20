import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function FeatureIcon(props: SvgIconProps) {
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
          d="M21 11.5C21 7.022 21 4.782 19.609 3.391C18.218 2 15.979 2 11.5 2C7.022 2 4.782 2 3.391 3.391C2 4.782 2 7.021 2 11.5C2 15.978 2 18.218 3.391 19.609C4.73 20.947 6.853 20.998 11 20.999M2.17017 7H20.6636M10 16H11.5M6 16H7M10 12H16M6 12H7M21.263 14.872C20.363 13.865 19.821 13.925 19.221 14.105C18.801 14.165 17.358 15.842 16.758 16.376C15.771 17.348 14.781 18.348 14.715 18.478C14.528 18.781 14.355 19.318 14.271 19.916C14.114 20.815 13.804 21.782 14.175 21.913C14.355 22.153 15.255 21.833 16.157 21.702C16.757 21.594 17.178 21.474 17.479 21.294C17.899 21.043 18.68 20.156 20.026 18.838C20.87 17.952 21.684 17.34 21.924 16.741C22.164 15.842 21.804 15.363 21.264 14.871"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
