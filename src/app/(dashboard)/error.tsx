'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Dashboard Layout Error:', error)
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToService(error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 border">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Errore Dashboard
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Si è verificato un errore durante il caricamento della dashboard. 
            {error.digest && (
              <span className="block text-sm mt-2">
                Codice errore: <code className="bg-gray-100 px-2 py-1 rounded">{error.digest}</code>
              </span>
            )}
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground mb-2">
                Dettagli tecnici (sviluppo)
              </summary>
              <div className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                <div className="font-mono">
                  <strong>Messaggio:</strong> {error.message}
                </div>
                {error.stack && (
                  <div className="mt-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={reset}
              className="w-full"
            >
              Riprova a caricare
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/debug-dashboard'}
              className="w-full"
            >
              Diagnostica problema
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Torna al Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}