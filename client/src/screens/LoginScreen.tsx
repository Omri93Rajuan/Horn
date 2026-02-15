import React, { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials, setLoading } from "../store/authSlice";
import { normalizeEmail, validateEmail, validatePassword } from "../utils/validators";
import { reconnectSocket } from "../hooks/useSocket";
import { toastError, toastWarning } from "../utils/toast";
import { useI18n } from "../i18n";

const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onMutate: () => dispatch(setLoading(true)),
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      reconnectSocket();
      const redirectTo = data.user.role === 'COMMANDER' ? '/commander' : '/soldier';
      navigate({ to: search.redirect ?? redirectTo });
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

  React.useEffect(() => {
    if (auth.token) {
      const redirectTo = auth.user?.role === 'COMMANDER' ? '/commander' : '/soldier';
      navigate({ to: redirectTo });
    }
  }, [auth.token, auth.user?.role, navigate]);

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
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              {t("auth.login.email")}
              <input
                id="login-email"
                name="email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@domain.com"
                autoComplete="email"
              />
            </label>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              {t("auth.login.password")}
              <input
                id="login-password"
                name="password"
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
            <button className="action-btn primary h-12" type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? t("auth.login.submitting") : t("auth.login.submit")}
            </button>
          </form>
          <div className="divider-line" />
          <p className="text-sm text-text-muted dark:text-text-dark-muted">
            {t("auth.login.no_account")}{" "}
            <Link className="text-primary hover:text-primary-hover" to="/register">
              {t("auth.login.register_now")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default LoginScreen;
