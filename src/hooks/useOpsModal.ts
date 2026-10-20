"use client";

import { useCallback } from "react";
import {
  setGeneralLoading,
  setOpsModalData,
  setOpsModalVisible,
} from "@redux/appSlice";
import { useAppDispatch, useAppSelector } from "@redux/hooks";

/** Modal içi CRUD formlarının (OpsForm) açılıp kapanmasını yönetir. */
export const useOpsModal = () => {
  const opsModalVisible = useAppSelector(
    (state) => state.AppReducer.opsModalVisible
  );
  const opsModalData = useAppSelector((state) => state.AppReducer.opsModalData);
  const dispatch = useAppDispatch();

  const setModalData = useCallback(
    (data: unknown) => dispatch(setOpsModalData(data)),
    [dispatch]
  );

  const openOpsModal = useCallback(() => {
    dispatch(setGeneralLoading(true));
    dispatch(setOpsModalData(null));
    dispatch(setOpsModalVisible(true));
  }, [dispatch]);

  const closeOpsModal = useCallback(() => {
    dispatch(setOpsModalVisible(false));
  }, [dispatch]);

  return {
    opsModalVisible,
    opsModalData,
    openOpsModal,
    closeOpsModal,
    setModalData,
  } as const;
};
