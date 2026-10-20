import { Button, type ButtonProps } from "@mui/material";

interface IBottomIconButtonProps {
  icon: React.ReactNode;
  label: string;
  color: ButtonProps["color"];
  buttonProps?: ButtonProps;
  disabled?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
}

export default function BottomIconButton({ icon, label, color, buttonProps, disabled, onClick, fullWidth }: IBottomIconButtonProps) {
  return (
    <Button variant="contained" color={color} startIcon={icon} disabled={disabled} onClick={onClick} fullWidth={fullWidth} {...buttonProps}>
      {label}
    </Button>
  );
}
