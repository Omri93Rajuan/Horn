import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { useAppDispatch } from "../store/hooks";
import { setCredentials, setLoading } from "../store/authSlice";
import { normalizeEmail, validateEmail, validatePassword } from "../utils/validators";
import { reconnectSocket } from "../hooks/useSocket";
import { toastError, toastWarning } from "../utils/toast";
import { useI18n } from "../i18n";

interface LoginScreenProps {
  onNavigateRegister?: () => void;
  onNavigateDemo?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateRegister, onNavigateDemo }) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onMutate: () => dispatch(setLoading(true)),
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      reconnectSocket();
      onSuccess?.();
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || t("error.login"));
    },
    onSettled: () => dispatch(setLoading(false)),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      toastError(t("error.required_fields"));
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toastError(emailValidation.message ?? t("error.invalid_email"));
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toastError(passwordValidation.message ?? t("error.invalid_password"));
      return;
    }

    loginMutation.mutate({ email: normalizeEmail(email), password });
  };

  React.useEffect(() => {
    const expired = sessionStorage.getItem("horn_auth_expired");
    if (expired === "1") {
      sessionStorage.removeItem("horn_auth_expired");
      toastWarning(t("auth.expired"));
    }
  }, []);

  return (
    <section className="grid min-h-[75vh] place-items-center">
      <div className="w-full max-w-lg rounded-[36px] border border-border dark:border-border-dark bg-surface-1/98 dark:bg-surface-1-dark/98 p-10 shadow-2xl">
        <div className="space-y-6">
          <div className="space-y-3 text-right">
            <h1 className="font-display text-3xl text-text dark:text-text-dark">{t("auth.login.title")}</h1>
            <p className="text-base text-text-muted dark:text-text-dark-muted">
              {t("auth.login.subtitle")}
            </p>
          </div>
          <form 
            className="grid gap-4" 
            onSubmit={handleSubmit}
            aria-label={t("auth.login.title")}
            noValidate
          >
            <div className="space-y-2">
              <label 
                htmlFor="login-email"
                className="text-sm text-text-muted dark:text-text-dark-muted"
              >
                {t("auth.login.email")}
                <span 
                  aria-label="required"
                  className="text-red-600 ml-1"
                  role="img"
                >
                  *
                </span>
              </label>
              <input
                id="login-email"
                name="email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@domain.com"
                autoComplete="email"
                required
                aria-required="true"
                aria-describedby={!validateEmail(email).isValid ? "email-error" : undefined}
              />
              {!validateEmail(email).isValid && email && (
                <div id="email-error" role="alert" className="text-sm text-red-600">
                  {validateEmail(email).message}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label 
                htmlFor="login-password"
                className="text-sm text-text-muted dark:text-text-dark-muted"
              >
                {t("auth.login.password")}
                <span 
                  aria-label="required"
                  className="text-red-600 ml-1"
                  role="img"
                >
                  *
                </span>
              </label>
              <input
                id="login-password"
                name="password"
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                autoComplete="current-password"
                required
                aria-required="true"
                aria-describedby={!validatePassword(password).isValid ? "password-error" : undefined}
              />
              {!validatePassword(password).isValid && password && (
                <div id="password-error" role="alert" className="text-sm text-red-600">
                  {validatePassword(password).message}
                </div>
              )}
            </div>
            <button 
              className="action-btn primary h-12" 
              type="submit" 
              disabled={loginMutation.isPending}
              aria-busy={loginMutation.isPending}
            >
              {loginMutation.isPending ? t("auth.login.submitting") : t("auth.login.submit")}
            </button>
          </form>
          <div className="divider-line" />
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-text-muted dark:text-text-dark-muted">
              {t("auth.login.no_account")} {" "}
              <button
                type="button"
                className="text-primary hover:text-primary-hover underline"
                onClick={() => onNavigateRegister?.()}
              >
                {t("auth.login.register_now")}
              </button>
            </p>
            {onNavigateDemo ? (
              <button
                type="button"
                onClick={() => onNavigateDemo()}
                className="group flex items-center gap-1.5 text-xs font-medium text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-primary transition-colors"
                title={t("demo.nav")}
                aria-label={t("demo.nav")}
              >
                <svg
                  className="w-4 h-4 group-hover:scale-110 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span>לדמו</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginScreen;
