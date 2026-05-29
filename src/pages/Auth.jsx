import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck, ArrowRight, Library, RefreshCw } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(''); // show OTP in UI for testing (no real email server)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // STEP 1: Request OTP from backend
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          collegeId: collegeId.trim() || ''
        })
      });

      const data = await response.json();
      setLoading(false);

      if (data.success) {
        // Dev mode: backend returns OTP in response since no real email server
        if (data.otp) setDevOtp(data.otp);
        setStep(2);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError('Unable to connect to the campus server. Please try again.');
      console.error(err);
    }
  };

  // STEP 2: Verify OTP with backend
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() })
      });

      const data = await response.json();
      setLoading(false);

      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError('Unable to connect to the campus server. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-bg-blob"></div>
      <div className="auth-bg-blob-2"></div>

      <div className="glass-panel auth-panel animate-pop">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary-color)' }}>
          <Library size={48} />
        </div>

        <h2 className="auth-title">UniHub</h2>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger-color)',
            color: 'var(--danger-color)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode}>
            {/* Email */}
            <div className="form-group">
              <label>College Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="yourname@college.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.75rem' }}
                  required
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Use your college email — any domain accepted.
              </p>
            </div>

            {/* College ID */}
            <div className="form-group">
              <label>College ID <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="e.g. 23BCE1234"
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value.replace(/\.edu$/i, ''))}
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Enter your college roll number to connect with classmates.
              </p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label>Verification Code</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ paddingLeft: '2.75rem', letterSpacing: '0.4em', textAlign: 'center', fontWeight: 'bold' }}
                  maxLength={6}
                  required
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                We sent a 6-digit verification code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
              </p>

              {/* Dev helper — shows OTP since no real email server */}
              {devOtp && (
                <div style={{
                  marginTop: '0.6rem',
                  padding: '0.6rem 1rem',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px dashed var(--primary-color)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--primary-color)'
                }}>
                  🔑 <strong>Dev Mode OTP:</strong> {devOtp}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Enter'}
              {!loading && <ShieldCheck size={18} />}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => { setStep(1); setError(''); setOtp(''); setDevOtp(''); }}
              disabled={loading}
            >
              <RefreshCw size={15} /> Back to Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
