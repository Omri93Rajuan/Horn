export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  message?: string;
} => {
  if (password.length < 6) {
    return {isValid: false, message: 'הסיסמה חייבת להכיל לפחות 6 תווים'};
  }
  return {isValid: true};
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};
