import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { areaService } from "../services/areaService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials, setLoading } from "../store/authSlice";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/validators";

const RegisterScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
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
      navigate({ to: "/dashboard" });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "אירעה שגיאה בהרשמה");
    },
    onSettled: () => dispatch(setLoading(false)),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !email || !password || !areaId) {
      alert("נא למלא את כל השדות החובה");
      return;
    }

    if (!validateName(name)) {
      alert("נא להזין שם מלא");
      return;
    }

    if (!validateEmail(email)) {
      alert("נא להזין אימייל תקין");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      alert(passwordValidation.message);
      return;
    }

    registerMutation.mutate({
      name,
      email,
      password,
      phone: phone || undefined,
      areaId,
    });
  };

  React.useEffect(() => {
    if (auth.token) {
      navigate({ to: "/dashboard" });
    }
  }, [auth.token, navigate]);

  return (
    <section className="grid min-h-[75vh] place-items-center">
      <div className="w-full max-w-lg rounded-[36px] border border-border dark:border-border-dark bg-surface-1/98 dark:bg-surface-1-dark/98 p-10 shadow-2xl">
        <div className="space-y-6">
          <div className="space-y-3 text-right">
            <h1 className="font-display text-3xl text-text dark:text-text-dark">יצירת חשבון חדש</h1>
            <p className="text-base text-text-muted dark:text-text-dark-muted">
              מלא את הפרטים ונחבר אותך מיד למרכז השליטה.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              שם מלא
              <input
                className="input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="ישראל ישראלי"
              />
            </label>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              אימייל
              <input
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@domain.com"
              />
            </label>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              סיסמה
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </label>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              טלפון (אופציונלי)
              <input
                className="input"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="050-0000000"
              />
            </label>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              אזור שירות
              {areasQuery.data && areasQuery.data.length > 0 ? (
                <select
                  className="input"
                  value={areaId}
                  onChange={(event) => setAreaId(event.target.value)}
                >
                  <option value="">בחר אזור</option>
                  {areasQuery.data.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  type="text"
                  value={areaId}
                  onChange={(event) => setAreaId(event.target.value)}
                  placeholder="area-1"
                />
              )}
              {areasQuery.isError ? (
                <span className="text-xs text-text-muted dark:text-text-dark-muted">
                  לא הצלחנו לטעון אזורים. אפשר להקליד ידנית.
                </span>
              ) : null}
            </label>
            <button className="action-btn primary" type="submit" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "יוצר חשבון..." : "הירשם"}
            </button>
            <p className="text-sm text-text-muted dark:text-text-dark-muted">
              כבר יש לך חשבון?{" "}
              <Link className="text-primary hover:text-primary-hover" to="/login" search={{ redirect: undefined }}>
                התחבר
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default RegisterScreen;
