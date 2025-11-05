'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Sei offline</h1>
          <p className="text-muted-foreground">
            Non è possibile connettersi a PayCrew in questo momento. Controlla la tua connessione internet e riprova.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Riprova
          </Button>

          <p className="text-sm text-muted-foreground">
            Alcune funzionalità potrebbero essere disponibili offline. Le modifiche verranno sincronizzate quando tornerai online.
          </p>
        </div>

        <div className="pt-6 border-t">
          <h2 className="font-semibold mb-3">Funzionalità offline disponibili:</h2>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Visualizzazione dati precedentemente caricati
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Consultazione lista dipendenti salvata
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Visualizzazione statistiche in cache
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
