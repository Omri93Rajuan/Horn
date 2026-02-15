import React from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authService } from "../services/authService";
import { useAppDispatch } from "../store/hooks";
import { setCredentials, setLoading } from "../store/authSlice";
import { reconnectSocket } from "../hooks/useSocket";
import { toastError, toastInfo } from "../utils/toast";
import { useI18n } from "../i18n";

const InvestorDemoScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();

  const demoLoginMutation = useMutation({
    mutationFn: authService.demoLogin,
    onMutate: () => dispatch(setLoading(true)),
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      reconnectSocket();
      toastInfo(t("demo.session_ready"));
      navigate({ to: "/demo-split" });
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.message || t("demo.unable_start"));
    },
    onSettled: () => dispatch(setLoading(false)),
  });

  return (
    <section className="grid min-h-[72vh] place-items-center">
      <div className="w-full max-w-3xl rounded-[36px] border border-border bg-surface-1/95 p-10 shadow-2xl dark:border-border-dark dark:bg-surface-1-dark/95">
        <div className="space-y-6 text-right">
          <p className="text-xs uppercase tracking-[0.35em] text-text-muted dark:text-text-dark-muted">
            {t("demo.investor_preview")}
          </p>
          <h1 className="text-4xl font-bold text-text dark:text-text-dark">{t("demo.investor_title")}</h1>
          <p className="text-base text-text-muted dark:text-text-dark-muted">
            {t("demo.investor_subtitle")} {t("demo.investor_subtitle_2")}
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => demoLoginMutation.mutate()}
              disabled={demoLoginMutation.isPending}
              className="action-btn primary h-12 min-w-[220px]"
            >
              {demoLoginMutation.isPending ? t("demo.preparing") : t("demo.enter")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvestorDemoScreen;

