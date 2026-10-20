"use client";

import { use } from "react";
import RolePermissionMatrix from "@forms/RolePermissionMatrix";

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RolePermissionMatrix roleId={Number(decodeURIComponent(id))} />;
}
