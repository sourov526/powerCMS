export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 64;

export type PasswordRuleStatus = {
  minLength: boolean;
  maxLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
};

export function getPasswordRuleStatus(password: string): PasswordRuleStatus {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    maxLength: password.length <= PASSWORD_MAX_LENGTH,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

export function passwordMeetsRequirements(password: string) {
  const rules = getPasswordRuleStatus(password);
  return Object.values(rules).every(Boolean);
}
