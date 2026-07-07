'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'

export default function RecuperaPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Se l\'indirizzo esiste, riceverai a breve un\'email con il link per reimpostare la password.')
      }
    } catch {
      setError('Si è verificato un errore durante l\'invio dell\'email')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Recupera Password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Inserisci la tua email per ricevere il link di ripristino
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive">
              {error}
            </Alert>
          )}

          {message && (
            <Alert variant="success">
              {message}
            </Alert>
          )}

          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-border placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-background"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Invio in corso...' : 'Invia link di ripristino'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Ricordi la password?{' '}
              <a href="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
                Accedi
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
