import React, { useEffect } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { router } from "./router";
import type { RootState } from "./store";
import ErrorBoundary from "./components/ErrorBoundary";
import { initNetworkMonitoring } from "./utils/networkService";

export const App: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    initNetworkMonitoring();
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} context={{ auth }} />
    </ErrorBoundary>
  );
};
