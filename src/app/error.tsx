'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Si è verificato un errore
          </h2>
          <p className="text-gray-600 mb-6">
            Si è verificato un errore durante il caricamento della dashboard. 
            Il nostro team è stato informato del problema.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Dettagli errore (sviluppo)
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
                {error.digest && `\n\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={reset}
              className="w-full"
            >
              Riprova
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
            >
              Torna alla Dashboard
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Vai al Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}