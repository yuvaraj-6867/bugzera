import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

type Step = 'email' | 'reset'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')

  // Step 1
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  // Step 2
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ── Step 1: Send OTP ──────────────────────────────────────────────
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      const res = await fetch('/api/v1/auth/forgot_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
      setStep('reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setSending(false)
    }
  }

  // ── Step 2: Reset Password ────────────────────────────────────────
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setResetting(true)
    try {
      const res = await fetch('/api/v1/auth/reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPassword, confirm_password: confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      setSuccess(data.message)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">BugZera</h1>
          <p className="text-gray-400">
            {step === 'email' ? 'Reset your password' : 'Enter OTP & new password'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 'email' ? 'bg-gradient-to-r from-accent-neon to-accent-electric text-white' : 'bg-green-500 text-white'}`}>
              {step === 'email' ? '1' : '✓'}
            </div>
            <div className={`flex-1 h-1 rounded ${step === 'reset' ? 'bg-gradient-to-r from-accent-neon to-accent-electric' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 'reset' ? 'bg-gradient-to-r from-accent-neon to-accent-electric text-white' : 'bg-gray-200 text-gray-400'}`}>
              2
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
              {success} Redirecting to login...
            </div>
          )}

          {/* ── STEP 1: Email ── */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value); setError('') }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
                <p className="text-xs text-gray-400 mt-1">
                  We'll send a 6-digit OTP to this email address.
                </p>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-accent-neon to-accent-electric text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {sending ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP + New Password ── */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">

              {/* Email hint */}
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                OTP sent to <span className="font-semibold">{email}</span>. Check your inbox.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all tracking-[0.5em] text-center text-xl font-bold"
                  placeholder="------"
                  maxLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setNewPassword(e.target.value); setError('') }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all"
                  placeholder="Minimum 6 characters"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setConfirmPassword(e.target.value); setError('') }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Re-enter new password"
                  required
                  autoComplete="new-password"
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setOtp(''); setNewPassword(''); setConfirmPassword('') }}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={resetting || !!success}
                  className="flex-1 bg-gradient-to-r from-accent-neon to-accent-electric text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {resetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleSendOtp({ preventDefault: () => {} } as FormEvent)}
                  className="text-sm text-accent-neon hover:text-accent-electric"
                >
                  Didn't receive OTP? Resend
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Back to login */}
        <p className="text-center text-gray-400 text-sm mt-8">
          Remember your password?{' '}
          <button onClick={() => navigate('/login')} className="text-accent-neon hover:text-accent-electric font-medium">
            Back to Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
