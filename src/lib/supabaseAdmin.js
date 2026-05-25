import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// TEMPORARILY DISABLED - para hindi mag-error
// export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
//   auth: {
//     autoRefreshToken: false,
//     persistSession: false
//   }
// })

export const supabaseAdmin = null