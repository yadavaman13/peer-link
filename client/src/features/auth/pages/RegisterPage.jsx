import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../../shared/hooks/useToast.js';
import { Input } from '../../shared/components/Input.jsx';
import { Button } from '../../shared/components/Button.jsx';
import { authService } from '../services/auth.service.js';
import { AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import '../styles/auth.css';

export function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Step state: 'CREDENTIALS' (1) | 'OTP' (2)
  const [step, setStep] = useState('CREDENTIALS');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  }

  function handleOtpChange(e) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: '' }));
    }
    if (serverError) setServerError('');
  }

  function validateCredentials() {
    const newErrors = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Step 1: Send verification OTP and proceed to Step 2
  async function handleSendOtp(e) {
    e.preventDefault();
    if (!validateCredentials()) return;

    setIsLoading(true);
    setServerError('');
    setSuccessMessage('');

    try {
      await authService.sendVerificationOtp({ email: formData.email.trim() });
      setStep('OTP');
      setResendCooldown(60);
      setSuccessMessage(`Verification code sent to ${formData.email.trim()}`);
    } catch (err) {
      setServerError(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2: Resend verification code
  async function handleResendOtp() {
    if (resendCooldown > 0 || isLoading) return;

    setIsLoading(true);
    setServerError('');
    setSuccessMessage('');

    try {
      await authService.resendOtp({
        email: formData.email.trim(),
        purpose: 'verify_email',
      });
      setResendCooldown(60);
      setSuccessMessage('A fresh verification code has been sent to your email.');
    } catch (err) {
      setServerError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2: Verify OTP and finalize registration
  async function handleVerifyAndRegister(e) {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrors({ otp: 'Please enter the complete 6-digit verification code' });
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      // 1. Verify OTP with backend
      await authService.verifyEmail({
        email: formData.email.trim(),
        otp: otp.trim(),
      });

      // 2. Complete account registration
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      showToast('Account created and email verified!', 'success');
      navigate('/rooms', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-brand">
            <span>PeerLink</span>
          </Link>
          <div className="auth-title">
            <span>{step === 'CREDENTIALS' ? 'Create your account' : 'Verify your email'}</span>
            <span className="auth-step-badge">
              {step === 'CREDENTIALS' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </span>
          </div>
          <p className="auth-subtitle">
            {step === 'CREDENTIALS'
              ? 'Join real-time WebRTC audio & video meetings'
              : 'Enter the 6-digit confirmation code sent to your email'}
          </p>
        </div>

        {serverError && (
          <div className="auth-error-banner" role="alert" style={{ marginBottom: '14px' }}>
            <AlertCircle size={15} />
            <span>{serverError}</span>
          </div>
        )}

        {successMessage && !serverError && (
          <div className="auth-success-banner" role="status" style={{ marginBottom: '14px' }}>
            <CheckCircle2 size={15} />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 'CREDENTIALS' ? (
          <form className="auth-form" onSubmit={handleSendOtp} noValidate>
            <div className="auth-row-2">
              <Input
                label="First name"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
              />
              <Input
                label="Last name"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
              />
            </div>

            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />

            <Button
              type="submit"
              variant="solid"
              size="lg"
              isLoading={isLoading}
              style={{ marginTop: '4px' }}
            >
              Continue to Verification
            </Button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyAndRegister} noValidate>
            <div className="auth-otp-target">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color="var(--text-secondary)" />
                <span className="auth-otp-email">{formData.email}</span>
              </div>
              <button
                type="button"
                className="auth-back-link"
                onClick={() => {
                  setStep('CREDENTIALS');
                  setServerError('');
                  setSuccessMessage('');
                }}
              >
                <ArrowLeft size={12} /> Edit
              </button>
            </div>

            <Input
              label="6-Digit Verification Code"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              maxLength={6}
              value={otp}
              onChange={handleOtpChange}
              error={errors.otp}
              className="auth-otp-input"
              autoFocus
            />

            <div className="auth-resend-row">
              <span>Didn't receive the code?</span>
              <button
                type="button"
                className="auth-resend-btn"
                disabled={resendCooldown > 0 || isLoading}
                onClick={handleResendOtp}
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
              </button>
            </div>

            <Button
              type="submit"
              variant="solid"
              size="lg"
              isLoading={isLoading}
              disabled={otp.length !== 6}
              style={{ marginTop: '6px' }}
            >
              Verify & Create Account
            </Button>
          </form>
        )}

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
