import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rlmokhkymktvbmhszbor.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbW9raGt5bWt0dmJtaHN6Ym9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODE2NDYsImV4cCI6MjA5ODE1NzY0Nn0.aTgPS2GU93Npm_VOfPpZbIZW-Bhxf_7vs4peyPLZYqY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)