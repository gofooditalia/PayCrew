import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Root page auth error:', error.message)
    }
    
    if (user) {
      redirect('/dashboard')
    }
  } catch (err) {
    console.error('Root page auth check error:', err)
  }
  
  // Altrimenti reindirizza al login
  redirect('/login')
}
