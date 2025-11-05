'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, RefreshCw } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)

  useEffect(() => {
    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setShowInstallPrompt(true)
      }
    }

    // Handle PWA update
    const handleControllerChange = () => {
      setShowUpdatePrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      }
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed')
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleUpdate = () => {
    setShowUpdatePrompt(false)
    window.location.reload()
  }

  if (showUpdatePrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">Aggiornamento disponibile</p>
            <p className="text-sm text-muted-foreground">
              Una nuova versione di PayCrew è disponibile. Ricarica per aggiornare.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdate}>
                Aggiorna ora
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowUpdatePrompt(false)}>
                Più tardi
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setShowUpdatePrompt(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <Download className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">Installa PayCrew</p>
            <p className="text-sm text-muted-foreground">
              Installa l&apos;app per un accesso rapido e funzionalità offline
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstallClick}>
                Installa
              </Button>
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                Non ora
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return null
}
