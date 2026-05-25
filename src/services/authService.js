import { supabase } from '../lib/supabase'

// Login
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// SEND OTP - store in database
export const sendOTP = async (email) => {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10) // 10 minutes expiry
  
  // Save OTP to database
  const { error: upsertError } = await supabase
    .from('password_reset_tokens')
    .upsert({
      email: email,
      token: otp,
      expires_at: expiresAt.toISOString(),
      used_at: null,
      created_at: new Date().toISOString()
    }, { onConflict: 'email' })
  
  if (upsertError) throw upsertError
  
  // Send email with OTP (using a backend service or EmailJS)
  // For now, return the OTP for testing
  console.log('OTP for', email, 'is:', otp)
  return { otp, message: 'OTP sent to your email' }
}

// VERIFY OTP
export const verifyOTP = async (email, otp) => {
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('email', email)
    .eq('token', otp)
    .eq('used_at', null)
    .single()
  
  if (error || !data) {
    throw new Error('Invalid or expired OTP')
  }
  
  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    throw new Error('OTP has expired')
  }
  
  // Mark as used
  await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('email', email)
  
  return { verified: true }
}

// RESET PASSWORD using OTP
export const resetPasswordWithOTP = async (email, newPassword) => {
  const { error } = await supabase.auth.admin.updateUserByEmail(email, {
    password: newPassword
  })
  
  if (error) throw error
  
  // Clear OTP
  await supabase
    .from('password_reset_tokens')
    .delete()
    .eq('email', email)
  
  return { success: true }
}