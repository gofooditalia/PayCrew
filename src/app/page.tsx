import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Se l'utente è autenticato, reindirizza al dashboard
  if (user) {
    redirect('/dashboard')
  }
  
  // Altrimenti reindirizza al login
  redirect('/login')
}
