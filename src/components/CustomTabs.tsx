import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import { Box, Tab, Tabs, type SxProps } from "@mui/material";

function TabPanel({ children, value, index, sx }: { children?: ReactNode; value: number; index: number; sx?: SxProps }) {
  return (
    <Box role="tabpanel" hidden={value !== index} id={`custom-tabpanel-${index}`} aria-labelledby={`custom-tab-${index}`} sx={sx}>
      {value === index && children}
    </Box>
  );
}

interface ICustomTabsProps {
  tabs: { label: string; content: ReactNode; icon?: string | React.ReactElement; sx?: SxProps }[];
  indicatorColor?: "primary" | "secondary";
  textColor?: "primary" | "secondary" | "inherit";
  variant?: "standard" | "scrollable" | "fullWidth";
  defaultTab?: number;
  propsValue?: number;
}

export default function CustomTabs({ tabs, indicatorColor = "primary", textColor = "inherit", variant = "fullWidth", defaultTab = 0, propsValue }: ICustomTabsProps) {
  const [value, setValue] = useState(defaultTab);

  const handleChange = (_event: SyntheticEvent, newValue: number) => setValue(newValue);

  useEffect(() => {
    if (propsValue !== undefined && propsValue !== null) setValue(propsValue);
  }, [propsValue]);

  return (
    <>
      <Tabs value={value} onChange={handleChange} indicatorColor={indicatorColor} textColor={textColor} variant={variant} sx={{ backgroundColor: "background.paper", borderRadius: "10px" }} data-cy="custom-tabs">
        {tabs.map((tab, index) => (
          <Tab key={index} label={tab.label} icon={tab?.icon} data-cy={`custom-tab-${index}`} />
        ))}
      </Tabs>
      {tabs.map((tab, index) => (
        <TabPanel key={index} value={value} index={index} sx={tab?.sx}>
          {tab.content}
        </TabPanel>
      ))}
    </>
  );
}
