import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import '../css/forgotpassword.css'
import mailIcon from '../assets/mail.svg'
import mailIconLight from '../assets/mail-light.svg'
import arrowIcon from '../assets/arrow-left.svg'
import arrowIconLight from '../assets/arrow-left-light.svg'
import moonIcon from '../assets/moon.svg'
import sunIcon from '../assets/sun.svg'
import eyeOpenIcon from '../assets/eye.svg'
import eyeOpenIconLight from '../assets/eye-light.svg'
import eyeClosedIcon from '../assets/eye-closed.svg'
import eyeClosedIconLight from '../assets/eye-closed-light.svg'
import { supabase } from '../lib/supabase'

function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState(1)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('theme')
    return savedMode === 'dark'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [generatedOTP, setGeneratedOTP] = useState('')
  const [isTestMode, setIsTestMode] = useState(false)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const showAlert = (type, message) => {
    Swal.fire({
      icon: type,
      title: type === 'success' ? 'Success!' : 'Oops...',
      text: message,
      confirmButtonColor: '#4cd7f6',
      background: isDarkMode ? '#051424' : '#f5f7fa',
      color: isDarkMode ? '#d5e4fa' : '#1a202c',
      confirmButtonText: 'OK',
      position: 'center',
    })
  }

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const requestPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    return true
  }

  // STEP 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!email) {
      showAlert('error', 'Please enter your email address')
      return
    }
    
    setIsLoading(true)
    
    try {
      const { data: userExists, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle()
      
      if (checkError || !userExists) {
        showAlert('error', 'No account found with this email address')
        setIsLoading(false)
        return
      }
      
      const newOTP = generateOTP()
      setGeneratedOTP(newOTP)
      
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 10)
      
      const { error: upsertError } = await supabase
        .from('password_reset_tokens')
        .upsert({
          email: email,
          token: newOTP,
          expires_at: expiresAt.toISOString(),
          used_at: null,
          created_at: new Date().toISOString()
        }, { onConflict: 'email' })
      
      if (upsertError) throw upsertError
      
      // Try to send email
      let emailSent = false
      try {
        await requestPasswordReset(email)
        emailSent = true
      } catch (emailError) {
        console.log('Email sending failed, switching to test mode')
        setIsTestMode(true)
      }
      
      Swal.fire({
        icon: 'info',
        title: '📱 Verification Code',
        html: `<div style="text-align: center;">
          <p>Your OTP code is:</p>
          <h1 style="font-size: 48px; letter-spacing: 10px; margin: 20px 0;">${newOTP}</h1>
          <p style="font-size: 12px;">Please enter this code to continue.</p>
          <hr>
          <p style="font-size: 11px;">${emailSent ? 'Email was also sent to your inbox.' : 'Test Mode - Email not sent'}</p>
        </div>`,
        confirmButtonColor: '#4cd7f6',
        background: isDarkMode ? '#051424' : '#f5f7fa',
        color: isDarkMode ? '#d5e4fa' : '#1a202c',
        confirmButtonText: 'Continue',
      })
      
      setStep(2)
      setCountdown(60)
    } catch (error) {
      showAlert('error', error.message || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  // STEP 2: Verify OTP - FIXED with maybeSingle()
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const otpValue = otp.join('')
    
    if (otpValue.length !== 6) {
      showAlert('error', 'Please enter the 6-digit verification code')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Use maybeSingle() to avoid "no rows" error
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('email', email)
        .eq('token', otpValue)
        .eq('used_at', null)
        .maybeSingle()
      
      if (error) {
        console.error('DB Error:', error)
        throw new Error('Database error. Please try again.')
      }
      
      if (!data) {
        // Check what OTP is in database for this email
        const { data: existing } = await supabase
          .from('password_reset_tokens')
          .select('token')
          .eq('email', email)
          .maybeSingle()
        
        console.log('Expected OTP:', generatedOTP)
        console.log('OTP in DB:', existing?.token)
        
        throw new Error(`Invalid verification code. Please check and try again.`)
      }
      
      if (new Date(data.expires_at) < new Date()) {
        throw new Error('OTP has expired. Please request a new one.')
      }
      
      // Mark as used
      await supabase
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('email', email)
        .eq('token', otpValue)
      
      setStep(3)
      showAlert('success', 'Code verified! Please create your new password')
    } catch (error) {
      console.error('❌ VERIFICATION ERROR:', error)
      showAlert('error', error.message || 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showAlert('error', 'Passwords do not match!')
      return
    }
    if (newPassword.length < 6) {
      showAlert('error', 'Password must be at least 6 characters')
      return
    }
    
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('email', email)
      
      Swal.fire({
        icon: 'success',
        title: 'Password Reset Successfully!',
        text: 'Please login with your new password.',
        confirmButtonColor: '#4cd7f6',
        background: isDarkMode ? '#051424' : '#f5f7fa',
        color: isDarkMode ? '#d5e4fa' : '#1a202c',
        confirmButtonText: 'Go to Login',
        position: 'center',
      }).then(() => {
        onBackToLogin()
      })
    } catch (error) {
      showAlert('error', error.message || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(0, 1)
    setOtp(newOtp)
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    
    setIsLoading(true)
    
    try {
      const newOTP = generateOTP()
      setGeneratedOTP(newOTP)
      
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 10)
      
      await supabase
        .from('password_reset_tokens')
        .upsert({
          email: email,
          token: newOTP,
          expires_at: expiresAt.toISOString(),
          used_at: null,
          created_at: new Date().toISOString()
        }, { onConflict: 'email' })
      
      try {
        await requestPasswordReset(email)
      } catch (emailError) {
        console.log('Resend email failed')
      }
      
      setCountdown(60)
      
      Swal.fire({
        icon: 'info',
        title: 'New Code Sent',
        html: `Your new OTP code is: <strong style="font-size: 32px;">${newOTP}</strong>`,
        confirmButtonColor: '#4cd7f6',
        background: isDarkMode ? '#051424' : '#f5f7fa',
        color: isDarkMode ? '#d5e4fa' : '#1a202c',
      })
    } catch (error) {
      showAlert('error', 'Failed to resend. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const currentMailIcon = isDarkMode ? mailIcon : mailIconLight
  const currentArrowIcon = isDarkMode ? arrowIcon : arrowIconLight
  const currentEyeOpenIcon = isDarkMode ? eyeOpenIcon : eyeOpenIconLight
  const currentEyeClosedIcon = isDarkMode ? eyeClosedIcon : eyeClosedIconLight

  return (
    <div className={`forgot-container ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="tech-grid"></div>
      <div className="scanlines"></div>

      <main className="main-content">
        <div className={`glass-card ${!isDarkMode ? 'glass-card-light' : ''}`}>
          <button onClick={toggleTheme} className="nasa-toggle-btn">
            <span className="toggle-track">
              <span className="toggle-thumb">
                {isDarkMode ? '🌙' : '☀️'}
              </span>
            </span>
            <span className="toggle-text">
              {isDarkMode ? 'DARK MODE' : 'LIGHT MODE'}
            </span>
          </button>

          <button onClick={step === 1 ? onBackToLogin : () => setStep(step - 1)} className="back-button">
            <img src={currentArrowIcon} alt="Back" />
            <span>{step === 1 ? 'Back to Login' : 'Back'}</span>
          </button>

          {isTestMode && (
            <div style={{
              position: 'absolute',
              top: '50px',
              right: '16px',
              background: '#f59e0b',
              color: '#000',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 'bold',
              zIndex: 20
            }}>
              TEST MODE
            </div>
          )}

          <div className="progress-container">
            <div className="progress-steps">
              <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Email</span>
              </div>
              <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
              <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Verify</span>
              </div>
              <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
              <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">Reset</span>
              </div>
            </div>
          </div>

          {step === 1 && (
            <>
              <div className="card-header">
                <h1 className={`title ${!isDarkMode ? 'title-light' : ''}`}>RESET PASSWORD</h1>
                <p className={`subtitle ${!isDarkMode ? 'subtitle-light' : ''}`}>
                  Enter your email address and we'll send you a verification code.
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="forgot-form">
                <div className="input-group">
                  <label className={`input-label ${!isDarkMode ? 'input-label-light' : ''}`}>Email Address</label>
                  <div className="input-wrapper">
                    <img src={currentMailIcon} alt="email" className="input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`input-field ${!isDarkMode ? 'input-field-light' : ''}`}
                      placeholder="enter your registered email"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className={`submit-btn ${!isDarkMode ? 'submit-btn-light' : ''}`} disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="card-header">
                <h1 className={`title ${!isDarkMode ? 'title-light' : ''}`}>VERIFY CODE</h1>
                <p className={`subtitle ${!isDarkMode ? 'subtitle-light' : ''}`}>
                  {isTestMode 
                    ? `Test Mode - Use the code shown in the popup` 
                    : `We've sent a 6-digit code to ${email}`}
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="forgot-form">
                <div className="otp-group">
                  <label className={`input-label ${!isDarkMode ? 'input-label-light' : ''}`}>Enter OTP Code</label>
                  <div className="otp-inputs">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        className={`otp-input ${!isDarkMode ? 'otp-input-light' : ''}`}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <div className="resend-section">
                  <span className="resend-text">Didn't receive code?</span>
                  {countdown > 0 ? (
                    <span className="countdown">Resend in {countdown}s</span>
                  ) : (
                    <button type="button" onClick={handleResendOTP} className="resend-button">
                      Resend Code
                    </button>
                  )}
                </div>

                <button type="submit" className={`submit-btn ${!isDarkMode ? 'submit-btn-light' : ''}`} disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div className="card-header">
                <h1 className={`title ${!isDarkMode ? 'title-light' : ''}`}>CREATE NEW PASSWORD</h1>
                <p className={`subtitle ${!isDarkMode ? 'subtitle-light' : ''}`}>
                  Enter your new password below.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="forgot-form">
                <div className="input-group">
                  <label className={`input-label ${!isDarkMode ? 'input-label-light' : ''}`}>New Password</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`input-field ${!isDarkMode ? 'input-field-light' : ''}`}
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                    >
                      {showPassword ? (
                        <img src={currentEyeOpenIcon} alt="hide" />
                      ) : (
                        <img src={currentEyeClosedIcon} alt="show" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className={`input-label ${!isDarkMode ? 'input-label-light' : ''}`}>Confirm Password</label>
                  <div className="input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`input-field ${!isDarkMode ? 'input-field-light' : ''}`}
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="password-toggle"
                    >
                      {showConfirmPassword ? (
                        <img src={currentEyeOpenIcon} alt="hide" />
                      ) : (
                        <img src={currentEyeClosedIcon} alt="show" />
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" className={`submit-btn ${!isDarkMode ? 'submit-btn-light' : ''}`} disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-left">
          <span className={`copyright ${!isDarkMode ? 'copyright-light' : ''}`}>
            © 2024 EURO MOTOR INVENTORY SYSTEMS. PRECISION ENGINEERED.
          </span>
          <div className={`status-badge ${!isDarkMode ? 'status-badge-light' : ''}`}>
            <span className="status-dot"></span>
            <span className={`status-text ${!isDarkMode ? 'status-text-light' : ''}`}>SYSTEM STATUS: NOMINAL</span>
          </div>
        </div>
        <div className="footer-right">
          <a href="#" className={`footer-link-item ${!isDarkMode ? 'footer-link-item-light' : ''}`}>Privacy Policy</a>
          <a href="#" className={`footer-link-item ${!isDarkMode ? 'footer-link-item-light' : ''}`}>Terms of Service</a>
          <a href="#" className={`footer-link-item ${!isDarkMode ? 'footer-link-item-light' : ''}`}>System Status</a>
        </div>
      </footer>
    </div>
  )
}

export default ForgotPassword