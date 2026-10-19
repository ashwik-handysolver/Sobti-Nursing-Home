import React, { useLayoutEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { getKeepSignedIn, setKeepSignedIn, supabase } from '../lib/supabase';
import {
  formatPhone,
  passwordStrength,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '../utils/validation';
import { Button, Field, Logo, TextInput } from './ui';
import { AuthShowcase } from './auth/AuthShowcase';

export type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const HEADINGS: Record<AuthMode, { title: string; subtitle: string }> = {
  login: { title: 'Welcome back', subtitle: 'Log in to manage your leads, consultations and follow-ups.' },
  signup: { title: 'Create your account', subtitle: 'For Sobti Nursing Home doctors and counsellors only.' },
  forgot: { title: 'Reset your password', subtitle: "Enter your email and we'll send you a reset link." },
  reset: { title: 'Choose a new password', subtitle: 'Use at least 8 characters with letters and numbers.' },
};

const STRENGTH = [
  { label: 'Too weak', bar: 'bg-rose-500' },
  { label: 'Fair', bar: 'bg-amber-500' },
  { label: 'Good', bar: 'bg-blue-500' },
  { label: 'Strong', bar: 'bg-emerald-500' },
];

// Supabase's messages are written for developers; translate the common ones
const friendlyError = (message: string) => {
  if (/invalid login credentials/i.test(message)) return 'Wrong email or password.';
  if (/email not confirmed/i.test(message)) return 'Confirm your email first, using the link we sent you.';
  if (/already registered/i.test(message)) return 'An account with this email already exists. Log in instead.';
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Wait a minute and try again.';
  if (/failed to fetch|network/i.test(message)) return "Can't reach the server. Check your internet connection.";
  return message;
};

// Text input with a leading icon, built on the shared TextInput
const IconInput: React.FC<React.ComponentProps<typeof TextInput> & { icon: React.ElementType; trailing?: React.ReactNode }> = ({
  icon: Icon,
  trailing,
  className = '',
  ...props
}) => (
  <div className="relative">
    <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    <TextInput
      {...props}
      className={`h-12 pl-10 ${trailing ? 'pr-12' : ''} rounded-xl! border-gray-300! bg-gray-50! shadow-sm focus:bg-white! hover:border-gray-400! focus:ring-2 focus:ring-blue-500/20 aria-[invalid=true]:border-rose-400! ${className}`}
    />
    {trailing}
  </div>
);

interface AuthPageProps {
  initialMode?: AuthMode;
  onPasswordReset?: () => void; // called after a new password is saved from a reset link
  initialNotice?: string; // e.g. why the user was signed out
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onPasswordReset, initialNotice }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedInState] = useState(getKeepSignedIn);
  const [capsLockOn, setCapsLockOn] = useState(false);
  // Caps Lock is a common cause of "wrong password", so it is pointed out while typing one
  const trackCapsLock = (e: React.KeyboardEvent) => setCapsLockOn(e.getModifierState('CapsLock'));
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice || null);

  // Logging in and signing up always happen in day mode, whatever theme the app was left in.
  // This runs before the first paint, so the page never flashes dark; the app sets its own theme once signed in.
  useLayoutEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark');
  }, []);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
    setFormError(null);
    setNotice(null);
    setPassword('');
    setConfirmPassword('');
  };

  // Checks only the fields shown in the current mode
  const validate = () => {
    const next: Record<string, string | null> = {};
    if (mode === 'signup') {
      next.name = validateName(name);
      next.phone = validatePhone(phone);
    }
    if (mode !== 'reset') next.email = validateEmail(email);
    if (mode === 'login') next.password = password ? null : 'Enter your password.';
    if (mode === 'signup' || mode === 'reset') {
      next.password = validatePassword(password);
      next.confirmPassword = confirmPassword === password ? null : 'Passwords do not match.';
    }
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  // Re-checks a field as soon as it has been corrected
  const clearError = (field: string) => setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !validate()) return;
    setBusy(true);
    setFormError(null);
    setNotice(null);
    try {
      if (mode === 'login') {
        setKeepSignedIn(keepSignedIn);
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim(), phone: formatPhone(phone) } },
        });
        if (error) throw error;
        // With email confirmation on, there is no session until the link is clicked
        if (!data.session) {
          switchMode('login');
          setNotice(`We sent a confirmation link to ${email.trim()}. Open it, then log in.`);
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setNotice(`If an account exists for ${email.trim()}, a reset link is on its way.`);
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        onPasswordReset?.();
      }
    } catch (err: any) {
      setFormError(friendlyError(err?.message || 'Something went wrong. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const strength = passwordStrength(password);
  const { title, subtitle } = HEADINGS[mode];
  const submitLabel = { login: 'Log in to Dashboard', signup: 'Create account', forgot: 'Send reset link', reset: 'Save new password' }[mode];

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-blue-400 cursor-pointer"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="relative isolate min-h-screen flex items-center justify-center p-0 sm:p-6 lg:p-10 overflow-hidden bg-[#e8eef8] text-gray-900">
      {/* Page backdrop in the clinic's blue and teal: soft glows, a faint dot grid, and a large
          outline of the emblem's cross. Decorative only; hidden behind the card on phones. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#dfe8f6] via-[#eef3fb] to-[#dcecf3]" />
        <div className="absolute -top-48 -left-40 w-[42rem] h-[42rem] rounded-full bg-blue-400/25 blur-3xl" />
        <div className="absolute -bottom-56 -right-40 w-[40rem] h-[40rem] rounded-full bg-teal-300/30 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 w-[30rem] h-[30rem] -translate-x-1/2 rounded-full bg-sky-300/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(30,64,175,0.14)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]" />
        <svg viewBox="0 0 100 100" fill="none" className="absolute -right-24 -top-24 w-[34rem] h-[34rem] text-blue-700/[0.06]">
          <path d="M35 5h30v30h30v30H65v30H35V65H5V35h30z" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
        </svg>
        <svg viewBox="0 0 100 100" fill="none" className="absolute -left-20 -bottom-28 w-[26rem] h-[26rem] text-teal-600/[0.07]">
          <path d="M35 5h30v30h30v30H65v30H35V65H5V35h30z" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="w-full max-w-[1600px] min-h-screen sm:min-h-0 lg:h-[calc(100dvh-5rem)] lg:min-h-[560px] grid lg:grid-cols-2 overflow-hidden bg-white sm:rounded-3xl sm:border sm:border-white sm:ring-1 sm:ring-slate-900/10 sm:shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35),0_8px_24px_-8px_rgba(15,23,42,0.15)]">
        <AuthShowcase />

        {/* Form */}
        <main className="relative isolate flex flex-col items-center justify-center px-5 py-6 sm:px-12 sm:py-10 lg:px-16 overflow-hidden">
          {/* The same backdrop as the page, much fainter, so the form side isn't flat white */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f7faff] to-[#eef5fb]" />
            <div className="absolute -top-32 -right-24 w-[26rem] h-[26rem] rounded-full bg-blue-200/30 blur-3xl" />
            <div className="absolute -bottom-36 -left-20 w-[24rem] h-[24rem] rounded-full bg-teal-100/50 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(rgba(30,64,175,0.09)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black_95%)]" />
            <svg viewBox="0 0 100 100" fill="none" className="hidden lg:block absolute -right-16 -bottom-16 w-72 h-72 text-blue-700/[0.05]">
              <path d="M35 5h30v30h30v30H65v30H35V65H5V35h30z" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="w-full max-w-sm space-y-6 sm:space-y-7">
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to log in
              </button>
            )}

            <div className="space-y-5">
              <Logo size="lg" />
              <div>
                <h2 className="text-[1.75rem] sm:text-[2.1rem] leading-tight font-bold tracking-tight text-gray-900">{title}</h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600">{subtitle}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5 [&_label]:uppercase [&_label]:tracking-wide">
              {mode === 'signup' && (
                <>
                  <Field label="Full name" error={errors.name}>
                    <IconInput
                      icon={User}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearError('name');
                      }}
                      autoComplete="name"
                      placeholder="Dr. Priya Sharma"
                      aria-invalid={Boolean(errors.name)}
                    />
                  </Field>
                  <Field label="Mobile number" error={errors.phone}>
                    <IconInput
                      icon={Phone}
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearError('phone');
                      }}
                      onBlur={() => phone && setErrors((prev) => ({ ...prev, phone: validatePhone(phone) }))}
                      autoComplete="tel"
                      placeholder="98201 44521"
                      maxLength={16}
                      aria-invalid={Boolean(errors.phone)}
                    />
                  </Field>
                </>
              )}

              {mode !== 'reset' && (
                <Field label="Work email" error={errors.email}>
                  <IconInput
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError('email');
                    }}
                    onBlur={() => email && setErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
                    autoComplete="email"
                    placeholder="you@clinic.com"
                    aria-invalid={Boolean(errors.email)}
                  />
                </Field>
              )}

              {mode !== 'forgot' && (
                <Field
                  label={mode === 'reset' ? 'New password' : 'Password'}
                  error={errors.password}
                  action={
                    mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-sm font-medium normal-case tracking-normal text-blue-600 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )
                  }
                >
                  <IconInput
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError('password');
                    }}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    aria-invalid={Boolean(errors.password)}
                    trailing={passwordToggle}
                    onKeyDown={trackCapsLock}
                    onKeyUp={trackCapsLock}
                    onBlur={() => setCapsLockOn(false)}
                  />
                  {capsLockOn && (
                    <p role="status" className="mt-1 text-xs font-medium text-amber-700">
                      Caps Lock is on
                    </p>
                  )}
                </Field>
              )}

              {(mode === 'signup' || mode === 'reset') && password && (
                <div className="-mt-1 flex items-center gap-3" aria-live="polite">
                  <div className="flex-1 grid grid-cols-3 gap-1">
                    {[1, 2, 3].map((level) => (
                      <span
                        key={level}
                        className={`h-1.5 rounded-full ${strength >= level ? STRENGTH[strength].bar : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">{STRENGTH[strength].label}</span>
                </div>
              )}

              {(mode === 'signup' || mode === 'reset') && (
                <Field label="Confirm password" error={errors.confirmPassword}>
                  <IconInput
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError('confirmPassword');
                    }}
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    onKeyDown={trackCapsLock}
                    onKeyUp={trackCapsLock}
                  />
                </Field>
              )}

              {mode === 'login' && (
                <label className="inline-flex items-center gap-2.5 -mt-1 text-sm normal-case! tracking-normal! text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedInState(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                  />
                  Keep me signed in
                </label>
              )}

              {formError && (
                <p role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 text-sm text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {formError}
                </p>
              )}
              {notice && (
                <p role="status" className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 text-sm text-gray-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  {notice}
                </p>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="mt-2 w-full h-13 rounded-full! text-base font-semibold bg-blue-700! hover:bg-blue-800! shadow-lg! shadow-blue-700/30! shadow-lg shadow-blue-600/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                {busy ? 'Please wait…' : submitLabel}
                {!busy && mode === 'login' && <ArrowRight className="w-5 h-5" />}
              </Button>
            </form>

            {(mode === 'login' || mode === 'signup') && (
              <p className="text-center text-sm text-gray-500">
                {mode === 'login' ? 'New to the clinic team? ' : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  className="font-medium text-blue-600 hover:underline cursor-pointer"
                >
                  {mode === 'login' ? 'Create a staff account' : 'Log in'}
                </button>
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
