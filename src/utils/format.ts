// Rupee amounts the way the clinic reads them: ₹65,000 · ₹2.4L · ₹1.2Cr
export function formatINR(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '₹0';
  if (amount >= 1e7) return `₹${trim(amount / 1e7)}Cr`;
  if (amount >= 1e5) return `₹${trim(amount / 1e5)}L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

const trim = (n: number) => (n >= 10 ? Math.round(n).toString() : n.toFixed(1).replace(/\.0$/, ''));

const toLocalDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00`);

// Whole days from an ISO date (YYYY-MM-DD…) until today; null when there is no date
export function daysSince(iso?: string): number | null {
  if (!iso) return null;
  const then = toLocalDate(iso);
  if (isNaN(then.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - then.getTime()) / 86_400_000));
}

export const describeDaysAgo = (days: number | null) =>
  days === null ? 'never' : days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;

// Indian mobile numbers for tel: and WhatsApp links; a 10-digit number gets the +91 prefix
export function phoneDigits(phone?: string): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11 && digits.length <= 13) return digits;
  return null;
}

export const telLink = (phone?: string) => {
  const digits = phoneDigits(phone);
  return digits ? `tel:+${digits}` : null;
};

export const whatsappLink = (phone?: string, text?: string) => {
  const digits = phoneDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
