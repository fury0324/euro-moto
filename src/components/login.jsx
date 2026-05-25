import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import '../css/login.css'
import mailIcon from '../assets/mail.svg'
import mailIconLight from '../assets/mail-light.svg'
import lockIcon from '../assets/lock-keyhole.svg'
import lockIconLight from '../assets/lock-keyhole-light.svg'
import eyeClosedIcon from '../assets/eye-closed.svg'
import eyeClosedIconLight from '../assets/eye-closed-light.svg'
import eyeOpenIcon from '../assets/eye.svg'
import eyeOpenIconLight from '../assets/eye-light.svg'
import moonIcon from '../assets/moon.svg'
import sunIcon from '../assets/sun.svg'
import { signIn } from '../services/authService'
import { supabase } from '../lib/supabase'

function Login({ onForgotPassword, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const data = await signIn(email, password)
      console.log('Login success:', data)
      
      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, is_active')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        console.error('Profile error:', profileError)
      }
      
      // Check if account is active
      if (profile && !profile.is_active) {
        await supabase.auth.signOut()
        Swal.fire({
          icon: 'error',
          title: 'Account Deactivated',
          text: 'Your account has been deactivated. Please contact administrator.',
          confirmButtonColor: '#4cd7f6',
          background: isDarkMode ? '#051424' : '#f5f7fa',
          color: isDarkMode ? '#d5e4fa' : '#1a202c',
        })
        setLoading(false)
        return
      }
      
      const userRole = profile?.role || 'cashier'
      const userName = profile?.full_name || data.user.email
      
      Swal.fire({
        icon: 'success',
        title: `Welcome, ${userName}!`,
        text: `Logged in as ${userRole.toUpperCase()}`,
        confirmButtonColor: '#4cd7f6',
        background: isDarkMode ? '#051424' : '#f5f7fa',
        color: isDarkMode ? '#d5e4fa' : '#1a202c',
        timer: 2000,
        showConfirmButton: false
      })
      
      // Store user info in localStorage
      localStorage.setItem('userRole', userRole)
      localStorage.setItem('userName', userName)
      localStorage.setItem('userEmail', email)
      
      // Call the success callback with user data
      if (onLoginSuccess) {
        onLoginSuccess({ ...data.user, role: userRole, full_name: userName })
      }
    } catch (error) {
      console.error('Login error:', error)
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.message || 'Invalid email or password',
        confirmButtonColor: '#4cd7f6',
        background: isDarkMode ? '#051424' : '#f5f7fa',
        color: isDarkMode ? '#d5e4fa' : '#1a202c',
      })
    } finally {
      setLoading(false)
    }
  }

  const currentMailIcon = isDarkMode ? mailIcon : mailIconLight
  const currentLockIcon = isDarkMode ? lockIcon : lockIconLight
  const currentEyeOpenIcon = isDarkMode ? eyeOpenIcon : eyeOpenIconLight
  const currentEyeClosedIcon = isDarkMode ? eyeClosedIcon : eyeClosedIconLight

  return (
    <div className={`login-container ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="tech-grid"></div>
      <div className="scanlines"></div>

      <main className="main-content">
        <div className={`glass-card ${!isDarkMode ? 'glass-card-light' : ''}`}>
          {/* NASA Style Theme Toggle Button */}
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

          <div className="card-header">
            <h1 className={`title ${!isDarkMode ? 'title-light' : ''}`}>SECURE LOGIN</h1>
            <p className={`subtitle ${!isDarkMode ? 'subtitle-light' : ''}`}>AUTHENTICATE TO ACCESS INVENTORY CONTROL</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label className={`input-label ${!isDarkMode ? 'input-label-light' : ''}`}>Email Address</label>
              <div className="input-wrapper">
                <img src={currentMailIcon} alt="email" className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`input-field ${!isDarkMode ? 'input-field-light' : ''}`}
                  placeholder="enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <div className="password-header">
                <label className={`input-label ${!isDarkMode ? 'input-label-light' : ''}`}>Access Key</label>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    onForgotPassword()
                  }}
                  className={`forgot-link ${!isDarkMode ? 'forgot-link-light' : ''}`}
                >
                  Forgot Password?
                </a>
              </div>
              <div className="input-wrapper">
                <img src={currentLockIcon} alt="lock" className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input-field ${!isDarkMode ? 'input-field-light' : ''}`}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? (
                    <img src={currentEyeOpenIcon} alt="hide password" />
                  ) : (
                    <img src={currentEyeClosedIcon} alt="show password" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className={`submit-btn ${!isDarkMode ? 'submit-btn-light' : ''}`} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="footer-link">
            <span className={`footer-text ${!isDarkMode ? 'footer-text-light' : ''}`}>No terminal access?</span>
            <a href="#" className={`credentials-link ${!isDarkMode ? 'credentials-link-light' : ''}`}>Request Credentials</a>
          </div>
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

export default Login
