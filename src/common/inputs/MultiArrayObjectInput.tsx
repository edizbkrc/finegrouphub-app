import { useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Person as PersonIcon } from "@mui/icons-material";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import type { ICommonInputProps } from "../types/ICommonInputProps";

interface IMultiArrayObjectItem {
  id?: string;
  creationDate?: Date | string | null;
  creatorUserName?: string | null;
  content: string | null;
}

export default function MultiArrayObjectInput({
  formItem,
  error,
  errorMessage,
  control,
  t,
  apiData,
  isEdit,
  variant,
  defaultValue,
}: ICommonInputProps) {
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const getColumnCount = () => {
    if (containerWidth < 400) return 1;
    if (containerWidth < 800) return 2;
    if (containerWidth < 1200) return 3;
    return 4;
  };

  useEffect(() => {
    const updateWidth = () => setContainerWidth(containerRef.current?.offsetWidth ?? 0);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const maxLength = (formItem?.registerOptions?.maxLength as { value?: number })?.value;
  const minLength = (formItem?.registerOptions?.minLength as { value?: number })?.value || 0;
  const maxInputLength = 5000;

  return (
    <Controller
      name={formItem?.name}
      control={control}
      defaultValue={defaultValue || []}
      rules={formItem?.registerOptions}
      render={({ field }) => {
        const currentLength = (field.value || []).length;
        const isMaxReached = !!maxLength && currentLength >= maxLength;
        const isMinReached = !!minLength && currentLength <= minLength;
        const canAddMore = !isMaxReached && !!inputValue.trim();

        const commitValue = () => {
          if (!canAddMore) return;
          const newItem: IMultiArrayObjectItem = { content: inputValue.trim() };
          const updated = [...(field.value || []), newItem];
          field.onChange(updated);
          formItem?.onChange?.(apiData, updated);
          setInputValue("");
        };

        return (
          <Box>
            <TextField
              fullWidth
              variant={variant}
              value={inputValue}
              onChange={(event) => {
                if (event.target.value.length <= maxInputLength) setInputValue(event.target.value);
              }}
              placeholder={formItem?.placeholder || t("PlaceHolderValue", { value: t(formItem.label) })}
              label={variant === "outlined" ? t(formItem.label) : undefined}
              disabled={formItem?.handleDisabled?.(isEdit, apiData) ?? false}
              error={!!error}
              helperText={errorMessage}
              onKeyUp={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitValue();
                }
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={commitValue}
                        disabled={!canAddMore}
                        color={canAddMore ? "primary" : "default"}
                        sx={{ transition: "all 0.2s ease", opacity: canAddMore ? 1 : 0.4 }}
                      >
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  inputProps: { "data-cy": `input-${formItem.name}`, maxLength: maxInputLength },
                },
              }}
            />

            <Box ref={containerRef} mt={2} sx={{ columns: getColumnCount(), columnGap: 2, width: "100%" }}>
              {(field.value || []).map((item: IMultiArrayObjectItem, index: number) => (
                <Card
                  key={item.id || index}
                  sx={{
                    borderRadius: 3,
                    transition: "all 0.3s ease",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.12)", transform: "translateY(-2px)" },
                    breakInside: "avoid",
                    pageBreakInside: "avoid",
                    display: "inline-block",
                    width: "100%",
                    mb: 2,
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, position: "relative", display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, backgroundColor: "primary.main", fontSize: "0.8rem", fontWeight: "bold", flexShrink: 0 }}>
                          {item.creatorUserName ? item.creatorUserName.charAt(0).toUpperCase() : <PersonIcon fontSize="small" />}
                        </Avatar>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {item.creatorUserName || t("AnonymousUser")}
                          </Typography>

                          {item.creationDate && (
                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", display: "block", lineHeight: 1 }}>
                              {getLocalizedMoment(item.creationDate).format("L LT")}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <IconButton
                        size="small"
                        onClick={() => {
                          if (isMinReached) return;
                          const updated = (field.value || []).filter((_: unknown, idx: number) => idx !== index);
                          field.onChange(updated);
                          formItem?.onChange?.(apiData, updated);
                        }}
                        disabled={isMinReached}
                        sx={{ color: isMinReached ? "action.disabled" : "error.main", width: 28, height: 28, transition: "all 0.2s ease", flexShrink: 0, opacity: isMinReached ? 0.4 : 1 }}
                        title={isMinReached ? t("MinItemsRequired", { count: minLength }) : t("Delete")}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ borderRadius: 1.5, p: 1.5, display: "flex", alignItems: "flex-start" }}>
                      <Typography variant="body2" sx={{ wordBreak: "break-word", lineHeight: 1.5, color: "text.primary", fontSize: "0.875rem" }}>
                        {item.content || t("ItemN", { index: index + 1 })}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        );
      }}
    />
  );
}
