import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function ReportIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        width="50"
        height="51"
        viewBox="0 0 50 51"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M42.9792 32.2604L42.9792 32.2648C42.9802 32.4402 42.9466 32.6142 42.8802 32.7766C42.8141 32.9385 42.7167 33.0859 42.5937 33.2102C42.5933 33.2106 42.5929 33.211 42.5925 33.2114L32.8525 42.9514C32.5846 43.2023 32.247 43.3438 31.8958 43.3438H18.0833C17.7483 43.3438 17.3952 43.1992 17.1345 42.9384L7.39234 33.1963C7.14147 32.9284 7 32.5908 7 32.2396V18.4271C7 18.0866 7.14854 17.735 7.3845 17.4991L17.1553 7.72825C17.3913 7.49229 17.7428 7.34375 18.0833 7.34375H31.9167C32.2572 7.34375 32.6087 7.49229 32.8447 7.72825L42.5868 17.4704C42.8377 17.7383 42.9792 18.0759 42.9792 18.4271L42.9792 32.2604Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="24.9895" cy="33.8677" r="2.06299" fill="currentColor" />
        <path
          d="M24.9895 14.7578V28.332"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </SvgIcon>
  );
}
