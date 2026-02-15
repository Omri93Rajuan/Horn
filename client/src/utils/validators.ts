type ValidationResult = {
  isValid: boolean;
  message?: string;
  value?: string;
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const normalizePhone = (phone: string): string => phone.replace(/[^\d]/g, "");

export const validateEmail = (email: string): ValidationResult => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { isValid: false, message: "Email is required" };
  }
  if (normalized.length > 254) {
    return { isValid: false, message: "Email is too long" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return { isValid: false, message: "Invalid email address" };
  }
  return { isValid: true, value: normalized };
};

export const validatePassword = (password: string): ValidationResult => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters" };
  }
  if (password.length > 72) {
    return { isValid: false, message: "Password is too long" };
  }
  if (/\s/.test(password)) {
    return { isValid: false, message: "Password must not include spaces" };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must include a lowercase letter" };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must include an uppercase letter" };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, message: "Password must include a number" };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, message: "Password must include a special character" };
  }
  return { isValid: true };
};

export const validateName = (name: string): ValidationResult => {
  const normalized = name.trim();
  const nameRegex = /^[\p{L}\p{M}][\p{L}\p{M}\s'-]{1,59}$/u;
  if (normalized.length < 2) {
    return { isValid: false, message: "Name must be at least 2 characters" };
  }
  if (!nameRegex.test(normalized)) {
    return { isValid: false, message: "Invalid name format" };
  }
  return { isValid: true, value: normalized };
};

export const validatePhone = (phone: string): ValidationResult => {
  const normalized = normalizePhone(phone.trim());
  if (!normalized) {
    return { isValid: true, value: "" };
  }
  if (!/^0\d{8,9}$/.test(normalized)) {
    return { isValid: false, message: "Invalid Israeli phone number" };
  }
  return { isValid: true, value: normalized };
};
