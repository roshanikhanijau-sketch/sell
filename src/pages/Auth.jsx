import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck, ArrowRight, Library } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter Code
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!email) return;
    
    // Simple university domain validation warning
    const isEdu = email.endsWith('.edu') || email.includes('@college.') || email.includes('@uni.');
    if (!isEdu) {
      setError('Please use a valid university email address (e.g., name@college.edu).');
      return;
    }

    setError('');
    setLoading(true);
    
    // Simulate API delay for sending code
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1200);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code) return;
    
    if (code !== '1234' && code !== '0000') {
      setError('Invalid verification code. Use code "1234" to test.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      setLoading(false);
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Login failed.');
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
        <p className="auth-subtitle">The Digital Ecosystem for Verified College Students</p>
        
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
            <div className="form-group">
              <label>College Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="yourname@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.75rem' }}
                  required
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Only verified university domains (ending in .edu or containing @college./@uni.) are permitted.
              </p>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Sending Code...' : 'Request Invitation'}
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
                  placeholder="Enter 1234 to verify"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ paddingLeft: '2.75rem', letterSpacing: '0.5em', textAlign: 'center', fontWeight: 'bold' }}
                  required
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                We sent a 4-digit verification code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
              </p>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Enter'}
              {!loading && <ShieldCheck size={18} />}
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '0.75rem' }} 
              onClick={() => { setStep(1); setError(''); }}
              disabled={loading}
            >
              Back to Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
