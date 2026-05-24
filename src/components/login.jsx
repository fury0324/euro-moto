import { useState, useEffect } from 'react'
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

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Load saved preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('theme')
    if (savedMode === 'light') {
      setIsDarkMode(false)
    } else if (savedMode === 'dark') {
      setIsDarkMode(true)
    }
  }, [])

  // Save preference when changed
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login attempt:', { email, password })
  }

  // Determine which icons to use based on theme
  const currentMailIcon = isDarkMode ? mailIcon : mailIconLight
  const currentLockIcon = isDarkMode ? lockIcon : lockIconLight
  const currentEyeOpenIcon = isDarkMode ? eyeOpenIcon : eyeOpenIconLight
  const currentEyeClosedIcon = isDarkMode ? eyeClosedIcon : eyeClosedIconLight

  return (
    <div className={`login-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Background Elements */}
      <div className="tech-grid"></div>
      <div className="scanlines"></div>

      {/* Theme Toggle Button */}
      <button onClick={toggleTheme} className="theme-toggle">
        <img 
          src={isDarkMode ? sunIcon : moonIcon} 
          alt={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        />
      </button>

      {/* Main Content */}
      <main className="main-content">
        <div className={`glass-card ${!isDarkMode ? 'glass-card-light' : ''}`}>
          <div className="card-header">
            <h1 className={`title ${!isDarkMode ? 'title-light' : ''}`}>SECURE LOGIN</h1>
            <p className={`subtitle ${!isDarkMode ? 'subtitle-light' : ''}`}>AUTHENTICATE TO ACCESS INVENTORY CONTROL</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
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
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="input-group">
              <div className="password-header">
                <label className={`input-label ${!isDarkMode ? 'input-label-light' : ''}`}>Access Key</label>
                <a href="#" className={`forgot-link ${!isDarkMode ? 'forgot-link-light' : ''}`}>Forgot Password?</a>
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
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  <img 
                    src={showPassword ? currentEyeOpenIcon : currentEyeClosedIcon} 
                    alt={showPassword ? "hide password" : "show password"}
                  />
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className={`submit-btn ${!isDarkMode ? 'submit-btn-light' : ''}`}>
              Sign In
            </button>
          </form>

          <div className="footer-link">
            <span className={`footer-text ${!isDarkMode ? 'footer-text-light' : ''}`}>No terminal access?</span>
            <a href="#" className={`credentials-link ${!isDarkMode ? 'credentials-link-light' : ''}`}>Request Credentials</a>
          </div>
        </div>
      </main>

      {/* Footer */}
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