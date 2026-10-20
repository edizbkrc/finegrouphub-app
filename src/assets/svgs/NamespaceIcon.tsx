import * as React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

export default function NamespaceIcon(props: SvgIconProps) {
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
          d="M12.7206 12C14.3126 12 15.6032 10.7094 15.6032 9.11734C15.6032 7.52529 14.3126 6.23468 12.7206 6.23468C11.1285 6.23468 9.83789 7.52529 9.83789 9.11734C9.83789 10.7094 11.1285 12 12.7206 12Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.63086 6.23467H4.07219V4.79334C4.07219 4.02881 4.3759 3.29559 4.9165 2.75499C5.45711 2.21438 6.19032 1.91068 6.95485 1.91068H18.4855C19.25 1.91068 19.9832 2.21438 20.5239 2.75499C21.0645 3.29559 21.3682 4.02881 21.3682 4.79334V19.2067C21.3682 19.9712 21.0645 20.7044 20.5239 21.245C19.9832 21.7856 19.25 22.0893 18.4855 22.0893H6.95485C6.19032 22.0893 5.45711 21.7856 4.9165 21.245C4.3759 20.7044 4.07219 19.9712 4.07219 19.2067V17.7653H2.63086M2.63086 12H4.07219M2.63086 9.11733H4.07219M2.63086 14.8827H4.07219"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          fillRule="evenodd"
          clipRule={"evenodd"}
          d="M17.0435 16.324V14.8827C17.0435 14.1181 16.7398 13.3849 16.1992 12.8443C15.6586 12.3037 14.9254 12 14.1608 12H11.2782C10.5136 12 9.78042 12.3037 9.23982 12.8443C8.69922 13.3849 8.39551 14.1181 8.39551 14.8827V16.324C8.39551 16.7063 8.54736 17.0729 8.81766 17.3432C9.08797 17.6135 9.45457 17.7653 9.83684 17.7653H15.6022C15.9844 17.7653 16.351 17.6135 16.6213 17.3432C16.8916 17.0729 17.0435 16.7063 17.0435 16.324Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </SvgIcon>
  );
}
