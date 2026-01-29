import React, { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials, setLoading } from "../store/authSlice";
import { validateEmail, validatePassword } from "../utils/validators";

const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onMutate: () => dispatch(setLoading(true)),
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      navigate({ to: search.redirect ?? "/dashboard" });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "אירעה שגיאה בהתחברות");
    },
    onSettled: () => dispatch(setLoading(false)),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      alert("נא למלא את כל השדות");
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

    loginMutation.mutate({ email, password });
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
            <h1 className="font-display text-3xl text-text dark:text-text-dark">כניסה למערכת</h1>
            <p className="text-base text-text-muted dark:text-text-dark-muted">
              התחבר כדי להמשיך למרכז השליטה.
            </p>
          </div>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm text-text-muted dark:text-text-dark-muted">
              אימייל
              <input
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@domain.com"
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </label>
            <button className="action-btn primary h-12" type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "מתחבר..." : "כניסה"}
            </button>
          </form>
          <div className="divider-line" />
          <p className="text-sm text-text-muted dark:text-text-dark-muted">
            אין לך חשבון?{" "}
            <Link className="text-primary hover:text-primary-hover" to="/register">
              הירשם עכשיו
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default LoginScreen;
