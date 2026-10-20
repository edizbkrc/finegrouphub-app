import { useTranslations } from "next-intl";
import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { TableRows, ViewHeadline } from "@mui/icons-material";
import { useDensity } from "../../hooks/useDensity";
import { DensityEnums } from "../../constants/DensityEnums";

export default function DensityPopover() {
  const t = useTranslations("Table");
  const { density, setDensity } = useDensity();

  return (
    <List dense>
      <ListItemButton onClick={() => setDensity(DensityEnums.Compact)}>
        <ListItemIcon>
          <ViewHeadline color={density === DensityEnums.Compact ? "secondary" : "action"} />
        </ListItemIcon>
        <ListItemText primary={t("Compact")} />
      </ListItemButton>
      <ListItemButton onClick={() => setDensity(DensityEnums.Standard)}>
        <ListItemIcon>
          <TableRows color={density === DensityEnums.Standard ? "secondary" : "action"} />
        </ListItemIcon>
        <ListItemText primary={t("Standard")} />
      </ListItemButton>
    </List>
  );
}
