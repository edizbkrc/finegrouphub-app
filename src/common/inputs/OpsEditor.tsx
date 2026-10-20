"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Controller } from "react-hook-form";
import { Box } from "@mui/material";
import "react-quill-new/dist/quill.snow.css";
import type { ICommonInputProps } from "../types/ICommonInputProps";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const TOOLBAR_MODULES = {
  toolbar: [
    [{ header: "1" }, { header: "2" }, { font: [] }],
    [{ size: [] }],
    [{ color: [] }, { background: [] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    ["clean"],
  ],
};

export default function OpsEditor({ formItem, control, defaultValue, setValue: setFormValue }: ICommonInputProps) {
  const [value, setValue] = useState(defaultValue || "");
  const isFirstRender = useRef(true);

  const handleChange = (newValue: string) => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setValue(newValue);
    setFormValue(formItem?.name, newValue, { shouldDirty: true });
  };

  return (
    <Controller
      name={formItem.name}
      control={control}
      render={() => (
        <Box>
          <ReactQuill
            theme="snow"
            value={value}
            onChange={handleChange}
            modules={TOOLBAR_MODULES}
            style={{ height: "100%", borderRadius: "10px" }}
            data-cy={`input-${formItem.name}`}
          />
        </Box>
      )}
    />
  );
}
