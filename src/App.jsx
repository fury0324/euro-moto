import { useState } from 'react'
import Swal from 'sweetalert2'
import Login from './components/Login'
import ForgotPassword from './components/ForgotPassword'

function App() {
  const [currentPage, setCurrentPage] = useState('login')

  const handleLoginSuccess = () => {
    Swal.fire({
      icon: 'success',
      title: 'Welcome to EURO MOTOR!',
      text: 'You have successfully logged in.',
      confirmButtonColor: '#4cd7f6',
      background: '#051424',
      color: '#d5e4fa',
      confirmButtonText: 'Continue',
      timer: 2000,
      timerProgressBar: true
    })
  }

  if (currentPage === 'login') {
    return <Login 
      onForgotPassword={() => setCurrentPage('forgot')} 
      onLoginSuccess={handleLoginSuccess}
    />
  }
  
  return <ForgotPassword onBackToLogin={() => setCurrentPage('login')} />
}

export default App