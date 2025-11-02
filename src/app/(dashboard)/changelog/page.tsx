import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { BuildingOfficeIcon, ClockIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

const changelog = [
  {
    version: 'v1.0.0',
    date: '2 Novembre 2025',
    type: 'feature',
    title: 'Gestione Sedi e Presenze',
    changes: [
      {
        icon: BuildingOfficeIcon,
        category: 'Gestione Sedi',
        color: 'from-blue-500 to-cyan-500',
        items: [
          'CRUD completo per sedi aziendali',
          'Integrazione nel profilo azienda',
          'Assegnazione sede ai dipendenti',
          'Visualizzazione sede in lista e dettaglio dipendenti',
          'Validazione per prevenire eliminazione sedi con dipendenti assegnati'
        ]
      },
      {
        icon: ClockIcon,
        category: 'Presenze',
        color: 'from-green-500 to-emerald-500',
        items: [
          'Pagina lista presenze con filtri e ricerca',
          'Registrazione presenza con calcolo automatico ore',
          'Colonna Note con popover informativo',
          'Inserimento e modifica manuale presenze',
          'Integrazione con sistema di activity logging'
        ]
      },
      {
        icon: UserGroupIcon,
        category: 'Miglioramenti UX Dipendenti',
        color: 'from-purple-500 to-pink-500',
        items: [
          'Redirect automatico a lista dipendenti dopo salvataggio',
          'Riorganizzazione colonne tabella dipendenti',
          'Colonna contratto consolidata (tipo, data assunzione, ore)',
          'Visualizzazione sede assegnata per ogni dipendente'
        ]
      }
    ]
  },
  {
    version: 'v0.9.0',
    date: '27 Ottobre 2025',
    type: 'feature',
    title: 'Fondamenta PayCrew',
    changes: [
      {
        icon: UserGroupIcon,
        category: 'Sistema Base',
        color: 'from-orange-500 to-red-500',
        items: [
          'Setup Next.js 16 con App Router',
          'Integrazione Supabase per autenticazione',
          'Database PostgreSQL con Prisma ORM',
          'Sistema di autenticazione con ruoli (SUPER_ADMIN, ADMIN, MANAGER, USER)',
          'Gestione completa aziende (CRUD)',
          'Gestione completa dipendenti (CRUD)',
          'Sistema di activity logging per audit trail',
          'UI components con shadcn/ui e Tailwind CSS'
        ]
      }
    ]
  }
]

export default function ChangelogPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 space-y-4 sm:space-y-0">
        <div className="flex-1">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Torna alla Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/70 rounded-lg">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Changelog
            </h1>
          </div>
          <p className="text-muted-foreground">
            Tutte le novità e gli aggiornamenti di PayCrew
          </p>
        </div>
      </div>

      {/* Changelog Timeline */}
      <div className="space-y-8">
        {changelog.map((release, releaseIndex) => (
          <Card key={releaseIndex} className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-accent/50 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
                      {release.version}
                    </span>
                    <span className="text-sm text-muted-foreground">{release.date}</span>
                  </div>
                  <CardTitle className="text-xl">{release.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {release.type === 'feature' && (
                    <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full">
                      NUOVE FUNZIONALITÀ
                    </span>
                  )}
                  {release.type === 'fix' && (
                    <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold rounded-full">
                      BUG FIX
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {release.changes.map((change, changeIndex) => {
                  const Icon = change.icon
                  return (
                    <div key={changeIndex} className="group">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 bg-gradient-to-br ${change.color} rounded-lg shadow-sm flex-shrink-0`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mt-1">
                          {change.category}
                        </h3>
                      </div>
                      <ul className="ml-11 space-y-2">
                        {change.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2 text-muted-foreground">
                            <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 p-6 bg-gradient-to-r from-accent/30 to-transparent border border-border rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          Hai suggerimenti o hai trovato un bug?{' '}
          <a href="https://github.com/gofooditalia/PayCrew/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
            Segnalalo su GitHub
          </a>
        </p>
      </div>
    </div>
  )
}
