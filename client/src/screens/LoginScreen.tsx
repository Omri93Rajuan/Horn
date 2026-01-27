import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { authService } from "../services/authService";
import { useAppDispatch } from "../store/hooks";
import { setCredentials, setLoading } from "../store/authSlice";
import { validateEmail, validatePassword } from "../utils/validators";

const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onMutate: () => {
      dispatch(setLoading(true));
    },
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      navigate({ to: search.redirect ?? "/dashboard" });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "אירעה שגיאה בהתחברות");
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
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

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>מערכת Horn</h1>
        <p>התחבר לחשבון שלך</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            אימייל
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@domain.com"
              autoComplete="email"
            />
          </label>
          <label>
            סיסמה
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>
          <button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "מתחבר..." : "התחבר"}
          </button>
        </form>
        <div className="auth-footer">
          <span>אין לך חשבון?</span>
          <Link to="/register">הירשם</Link>
        </div>
      </div>
    </section>
  );
};

export default LoginScreen;