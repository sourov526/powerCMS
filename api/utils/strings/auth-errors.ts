type TranslationFn = (key: string) => string;

const AUTH_ERROR_KEYS: Record<string, string> = {
  "Email and password are required.": "emailPasswordRequired",
  "Name is required.": "nameRequired",
  "Invalid credentials.": "invalidCredentials",
  "Your account is not active yet.": "accountInactive",
  "Your account is not approved yet.": "accountInactive",
  "Account not active.": "accountInactive",
  "Password must be at least 6 characters.": "passwordLength",
  "Password does not meet requirements.": "passwordRequirements",
  "Email is already registered.": "emailRegistered",
  "Invalid email.": "invalidEmail",
  "User not found.": "userNotFound",
  "Invalid OTP or expired.": "invalidOtp",
  "OTP and password are required.": "otpPasswordRequired",
  "Current password is required.": "currentPasswordRequired",
  "Current password is incorrect.": "currentPasswordIncorrect",
  "New password must be different from current password.": "passwordUnchanged",
  "Unauthorized.": "unauthorized",
  "Failed to create user.": "registerFailed",
  "Login temporarily unavailable.": "loginFailed",
  "D1 database is not configured.": "loginFailed",
  "Database is not configured.": "loginFailed",
};

export function mapAuthError(message: string | null | undefined, t: TranslationFn) {
  if (!message) return t("generic");
  const key = AUTH_ERROR_KEYS[message];
  return key ? t(key) : t("generic");
}
