'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XMarkIcon, SparklesIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { BuildingOfficeIcon, ClockIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

const FEATURES = [
  {
    icon: BuildingOfficeIcon,
    title: 'Gestione Sedi',
    description: 'Organizza le tue filiali e assegna i dipendenti alle diverse sedi operative',
    link: '/azienda/modifica',
    linkText: 'Configura Sedi',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: ClockIcon,
    title: 'Presenze',
    description: 'Monitora gli orari di lavoro con calcolo automatico delle ore lavorate e straordinari',
    link: '/presenze',
    linkText: 'Vai a Presenze',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: CalendarIcon,
    title: 'Gestione Turni',
    description: 'Pianifica i turni del personale con controllo automatico delle sovrapposizioni e pianificazione multipla',
    link: '/turni',
    linkText: 'Vai a Turni',
    color: 'from-purple-500 to-pink-500'
  }
]

const STORAGE_KEY = 'paycrew_features_announcement_dismissed'
const CURRENT_VERSION = 'v1.1' // Incrementa questa versione quando ci sono nuove feature

export default function FeatureAnnouncement() {
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    // Controlla se l'utente ha già visto questo annuncio
    const dismissedVersion = localStorage.getItem(STORAGE_KEY)
    setIsDismissed(dismissedVersion === CURRENT_VERSION)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION)
    setIsDismissed(true)
  }

  if (isDismissed) return null

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-lg mb-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl"></div>

      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/70 rounded-lg">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Nuove Funzionalità Disponibili!
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Scopri le ultime novità di PayCrew
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="hover:bg-accent/50 -mt-2"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group p-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:shadow-md transition-all duration-200 hover:border-primary/30"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 bg-gradient-to-br ${feature.color} rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {feature.description}
                    </p>
                    <Link href={feature.link}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-primary/30 hover:bg-primary/10 hover:border-primary"
                      >
                        {feature.linkText} →
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Vuoi vedere tutte le novità?{' '}
            <Link href="/changelog" className="text-primary hover:underline font-medium">
              Visita il Changelog
            </Link>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Non mostrare più
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
