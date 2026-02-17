import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { areaService } from "../services/areaService";
import { useAppDispatch } from "../store/hooks";
import { setCredentials, setLoading } from "../store/authSlice";
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validatePhone,
  validatePassword,
} from "../utils/validators";
import { reconnectSocket } from "../hooks/useSocket";
import { formatAreaName } from "../utils/dateUtils";
import { toastError } from "../utils/toast";
import { useI18n } from "../i18n";

interface RegisterScreenProps {
  onNavigateLogin?: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateLogin }) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [areaId, setAreaId] = useState("");

  const areasQuery = useQuery({
    queryKey: ["areas"],
    queryFn: areaService.getAreas,
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onMutate: () => dispatch(setLoading(true)),
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      reconnectSocket();
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || t("error.register"));
    },
    onSettled: () => dispatch(setLoading(false)),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !email || !password || !areaId) {
      toastError(t("error.required_fields_register"));
      return;
    }

    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      toastError(nameValidation.message ?? t("error.invalid_name"));
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

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      toastError(phoneValidation.message ?? "Invalid phone number");
      return;
    }

    registerMutation.mutate({
      name: name.trim(),
      email: normalizeEmail(email),
      password,
      phone: phoneValidation.value || undefined,
      areaId,
    });
  };

  return (
    <section className="grid min-h-[75vh] place-items-center">
      <div className="w-full max-w-lg rounded-[36px] border border-border dark:border-border-dark bg-surface-1/98 dark:bg-surface-1-dark/98 p-6 sm:p-10 shadow-2xl mx-3 sm:mx-0">
        <div className="space-y-6">
          <div className="space-y-3 text-right">
            <h1 className="font-display text-3xl text-text dark:text-text-dark">{t("auth.register.title")}</h1>
            <p className="text-sm text-text-muted dark:text-text-dark-muted">
              {t("auth.register.have_account")} {" "}
              <button
                type="button"
                className="text-primary hover:text-primary-hover underline"
                onClick={() => onNavigateLogin?.()}
              >
                {t("auth.register.login")}
              </button>
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit} aria-label={t("auth.register.title")} noValidate>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              {t("auth.register.name")}
              <input
                id="register-name"
                name="name"
                className="input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="ישראל ישראלי"
              />
            </label>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              {t("auth.register.email")}
              <input
                id="register-email"
                name="email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@domain.com"
              />
            </label>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              {t("auth.register.password")}
              <input
                id="register-password"
                name="password"
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
              />
            </label>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              {t("auth.register.phone")}
              <input
                id="register-phone"
                name="phone"
                className="input"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="050-0000000"
              />
            </label>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              {t("auth.register.area")}
              {areasQuery.data && areasQuery.data.length > 0 ? (
                <select
                  id="register-area"
                  name="areaId"
                  className="input"
                  value={areaId}
                  onChange={(event) => setAreaId(event.target.value)}
                >
                  <option value="">{t("auth.register.select_area")}</option>
                  {areasQuery.data.map((area) => (
                    <option key={area} value={area}>
                      {formatAreaName(area)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="register-area"
                  name="areaId"
                  className="input"
                  type="text"
                  value={areaId}
                  onChange={(event) => setAreaId(event.target.value)}
                  placeholder="gush-dan"
                />
              )}
              {areasQuery.isError ? (
                <span className="text-xs text-text-muted dark:text-text-dark-muted">
                  לא הצלחנו לטעון אזורים. אפשר להקליד ידנית.
                </span>
              ) : null}
            </label>
            <button className="action-btn primary" type="submit" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? t("auth.register.submitting") : t("auth.register.submit")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default RegisterScreen;
