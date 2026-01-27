import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { authService } from "../services/authService";
import { useAppDispatch } from "../store/hooks";
import { setCredentials, setLoading } from "../store/authSlice";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/validators";

const RegisterScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [areaId, setAreaId] = useState("");

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

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>יצירת חשבון</h1>
        <p>מלא את הפרטים והתחל להשתמש במערכת</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            שם מלא
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ישראל ישראלי"
            />
          </label>
          <label>
            אימייל
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@domain.com"
            />
          </label>
          <label>
            סיסמה
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>
          <label>
            טלפון (אופציונלי)
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="050-0000000"
            />
          </label>
          <label>
            קוד אזור
            <input
              type="text"
              value={areaId}
              onChange={(event) => setAreaId(event.target.value)}
              placeholder="A-100"
            />
          </label>
          <button type="submit" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "יוצר חשבון..." : "הירשם"}
          </button>
        </form>
        <div className="auth-footer">
          <span>כבר יש לך חשבון?</span>
          <Link to="/login" search={{ redirect: undefined }}>
            התחבר
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RegisterScreen;