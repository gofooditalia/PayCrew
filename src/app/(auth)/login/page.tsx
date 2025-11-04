'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        // Mantieni il loading attivo durante il redirect
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Si è verificato un errore durante l\'accesso')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Accedi a PayCrew
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Gestionale Dipendenti e Buste Paga
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <Alert variant="destructive">
              {error}
            </Alert>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder:text-muted-foreground text-foreground rounded-t-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-background"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder:text-muted-foreground text-foreground rounded-b-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm bg-background"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Non hai un account?{' '}
              <a href="/register" className="font-medium text-primary hover:text-primary-dark transition-colors">
                Registrati
              </a>
            </p>

            {/* Crediti GO!Food Italia */}
            <div className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1">
              <div className="text-muted-foreground/60">
                Fatto con ❤️ da
              </div>
              <a
                href="mailto:italiagofood@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
              >
                <img
                  src="/gofood.svg"
                  alt="GO!Food Italia"
                  className="h-4 w-auto"
                />
                GO!Food Italia
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}