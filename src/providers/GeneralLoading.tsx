"use client";

import { useAppSelector } from "@redux/hooks";
import LoadingComponent from "@components/LoadingComponent";

export default function GeneralLoading({
  children,
}: {
  children: React.ReactNode;
}) {
  const generalLoading = useAppSelector(
    (state) => state.AppReducer.generalLoading
  );

  return (
    <>
      <LoadingComponent open={generalLoading} />
      {children}
    </>
  );
}
