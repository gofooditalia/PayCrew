'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Alert } from '@/components/ui/alert'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      // Registra l'utente in Supabase Auth
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Registrazione completata! Controlla la tua email per confermare l\'account.')
        // In un'app reale, potresti voler reindirizzare a una pagina di attesa
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch {
      setError('Si è verificato un errore durante la registrazione')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Registrati a PayCrew
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Gestionale Dipendenti e Buste Paga
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
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
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Il tuo nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder:text-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
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
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Hai già un account?{' '}
              <a href="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
                Accedi
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