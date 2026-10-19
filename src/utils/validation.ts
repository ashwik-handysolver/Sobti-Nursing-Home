// Shared input checks. Each returns an error message, or null when the value is fine.

const digitsOf = (value: string) => value.replace(/\D/g, '');

// Indian numbers: 10 digits, optionally written with +91, 91 or a leading 0
export function validatePhone(value: string, { required = true } = {}): string | null {
  const raw = value.trim();
  if (!raw) return required ? 'Enter a phone number.' : null;
  if (/[^\d\s+\-()]/.test(raw)) return 'Use digits only (spaces, +, - and brackets are fine).';
  let digits = digitsOf(raw);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length < 10) return 'Phone number must have at least 10 digits.';
  if (digits.length > 10) return 'Phone number has too many digits.';
  if (!/^[6-9]/.test(digits)) return 'Enter a valid mobile number (it should start with 6, 7, 8 or 9).';
  return null;
}

// Stores numbers in one consistent form: +91 followed by the 10 digits
export function formatPhone(value: string): string {
  let digits = digitsOf(value);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : value.trim();
}

export function validateEmail(value: string, { required = true } = {}): string | null {
  const raw = value.trim();
  if (!raw) return required ? 'Enter an email address.' : null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) return 'Enter a valid email address, like name@example.com.';
  return null;
}

export function validateName(value: string): string | null {
  const raw = value.trim();
  if (!raw) return 'Enter a name.';
  if (raw.length < 2) return 'Name is too short.';
  if (/\d/.test(raw)) return 'Name should not contain numbers.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Use both letters and numbers.';
  return null;
}

// 0 = weak, 1 = fair, 2 = good, 3 = strong
export function passwordStrength(value: string): 0 | 1 | 2 | 3 {
  if (validatePassword(value)) return 0;
  let score = 1;
  if (value.length >= 12) score++;
  if (/[^A-Za-z0-9]/.test(value) || (/[a-z]/.test(value) && /[A-Z]/.test(value))) score++;
  return Math.min(3, score) as 1 | 2 | 3;
}

// Last 10 digits of a phone number, for spotting the same number written differently
export const phoneKey = (value: string) => value.replace(/\D/g, '').slice(-10);

// Rupee amounts such as "65000", "₹65,000", "65k" or "1.2 lakh"; blank is allowed
export function parseAmount(value: string): number | null {
  const raw = value.trim().toLowerCase().replace(/[₹,\s]|rs\.?|inr/g, '');
  if (!raw) return null;
  const match = raw.match(/^(\d+(?:\.\d+)?)(k|l|lakh|lac)?$/);
  if (!match) return NaN;
  const unit = match[2] === 'k' ? 1000 : match[2] ? 100000 : 1;
  return Math.round(parseFloat(match[1]) * unit);
}

export function validateAmount(value: string): string | null {
  const amount = parseAmount(value);
  if (amount === null) return null;
  if (Number.isNaN(amount)) return 'Enter an amount in rupees, like 65000 or ₹65,000.';
  if (amount < 100) return 'Amount looks too small.';
  if (amount > 10000000) return 'Amount looks too large (over ₹1 crore).';
  return null;
}

export const formatAmount = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export function validateAge(value: string): string | null {
  if (!value.trim()) return null;
  const age = Number(value);
  if (!Number.isInteger(age) || age < 0 || age > 120) return 'Enter an age between 0 and 120.';
  return null;
}
