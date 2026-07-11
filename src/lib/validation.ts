export function validateAmount(value: string): string | null {
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) return "Amount must be greater than 0";
  if (n > 999999999) return "Amount is too large";
  return null;
}

export function validateRequired(value: string, field: string): string | null {
  if (!value || !value.trim()) return `${field} is required`;
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value)) return "Invalid email format";
  return null;
}

export function validatePassword(value: string): string | null {
  if (value && value.length < 6) return "Password must be at least 6 characters";
  return null;
}

export function sanitize(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}
