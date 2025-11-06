import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { BuildingOfficeIcon, ClockIcon, UserGroupIcon, DocumentTextIcon, CalendarIcon, ChartBarIcon, BoltIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

const changelog = [
  {
    version: 'v0.5.0',
    date: '6 Novembre 2025',
    type: 'feature',
    title: 'Integrazione Turni-Presenze',
    changes: [
      {
        icon: CalendarIcon,
        category: 'Auto-generazione Presenze da Turni',
        color: 'from-violet-500 to-purple-500',
        items: [
          'Le presenze vengono create automaticamente quando si pianificano i turni',
          'Relazione database turno → presenza con campo turnoId',
          'Service layer PresenzeFromTurniService per logica business centralizzata',
          'Calcolo automatico ore lavorate e straordinari basato su orari turno',
          'Gestione errori non-bloccante: turni creati anche se generazione presenza fallisce'
        ]
      },
      {
        icon: BoltIcon,
        category: 'Stati Presenza e Workflow',
        color: 'from-amber-500 to-orange-500',
        items: [
          'Enum stati presenza: DA_CONFERMARE, CONFERMATA, MODIFICATA, ASSENTE',
          'Badge colorati per visualizzazione visuale dello stato (giallo, verde, blu, rosso)',
          'Bottone "Conferma" rapido per presenze con stato DA_CONFERMARE',
          'Workflow completo: Turno → Presenza (DA_CONFERMARE) → Conferma/Modifica/Assente',
          'Colonna Stato nella tabella presenze'
        ]
      },
      {
        icon: DocumentTextIcon,
        category: 'API e Testing',
        color: 'from-blue-500 to-cyan-500',
        items: [
          'API POST /api/presenze/from-turni per generazione batch presenze da turni esistenti',
          'API PUT /api/presenze/[id]/conferma per conferma/modifica/assenza presenze',
          'Test automatizzati completo con 11/12 test passati (91.7% successo)',
          'Comando npm: npm run test:turni-presenze per eseguire i test di integrazione',
          'Migration SQL per aggiunta enum stato_presenza e campo turnoId'
        ]
      }
    ]
  },
  {
    version: 'v0.4.0',
    date: '5 Novembre 2025',
    type: 'feature',
    title: 'Sistema Buste Paga e Turni',
    changes: [
      {
        icon: CalendarIcon,
        category: 'Gestione Turni',
        color: 'from-indigo-500 to-blue-500',
        items: [
          'CRUD turni completo con filtri per dipendente, sede, tipo, date',
          'Pianificazione multipla per creazione batch turni (settimanale/mensile)',
          'Filtri avanzati e ricerca nella lista turni',
          'Tipi turno: MATTINA, PRANZO, SERA, NOTTE, SPEZZATO',
          'Validazione orari e conflitti turni'
        ]
      },
      {
        icon: DocumentTextIcon,
        category: 'Sistema Buste Paga',
        color: 'from-green-500 to-emerald-500',
        items: [
          'Generazione cedolini con calcolo automatico stipendio',
          'PDF Cedolini con dettaglio completo retribuzione',
          'Report Presenze con export e visualizzazione',
          'Report Cedolini per storico cedolini mensili per dipendente',
          'Unificazione routing: /buste-paga redirige a /cedolini per consistenza'
        ]
      }
    ]
  },
  {
    version: 'v0.3.0',
    date: '4 Novembre 2025',
    type: 'feature',
    title: 'UX e Performance',
    changes: [
      {
        icon: BoltIcon,
        category: 'Skeleton Loading',
        color: 'from-yellow-500 to-amber-500',
        items: [
          'Skeleton Loading: Componenti loading professionali su tutte le pagine dinamiche',
          'PageLoader unificato: Loading state consistente con titolo + sottotitolo',
          'Coverage 100% skeleton loading su pagine dinamiche',
          'Tempi di caricamento percepiti ridotti significativamente'
        ]
      },
      {
        icon: BuildingOfficeIcon,
        category: 'Gestione Sedi',
        color: 'from-blue-500 to-cyan-500',
        items: [
          'CRUD completo per sedi aziendali',
          'Assegnazione Sede: Collegamento dipendenti a sedi specifiche',
          'Colonne Dipendenti: Riorganizzate per maggiore leggibilità',
          'Redirect automatico: Dopo save/update dipendente torna alla lista',
          'Colonna Contratto: Consolidati tipo contratto, data assunzione, ore settimanali'
        ]
      }
    ]
  },
  {
    version: 'v0.2.0',
    date: '3 Novembre 2025',
    type: 'feature',
    title: 'Gestione Presenze',
    changes: [
      {
        icon: ClockIcon,
        category: 'Registro Presenze',
        color: 'from-green-500 to-emerald-500',
        items: [
          'Lista presenze con filtri e ricerca avanzata',
          'Calcolo ore automatico: Ore lavorate e straordinari calcolati automaticamente',
          'Note con popover: Visualizzazione note presenze con popover interattivo',
          'Filtri avanzati: Per dipendente, sede, range date',
          'Validazione orari: Controllo coerenza entrata/uscita'
        ]
      }
    ]
  },
  {
    version: 'v0.1.0',
    date: '1 Novembre 2025',
    type: 'feature',
    title: 'Foundation e Dipendenti',
    changes: [
      {
        icon: UserGroupIcon,
        category: 'Setup Iniziale',
        color: 'from-orange-500 to-red-500',
        items: [
          'Setup Next.js 16 + Supabase + Prisma',
          'Autenticazione: Sistema completo con ruoli (SUPER_ADMIN, ADMIN, MANAGER, USER)',
          'Gestione Aziende: CRUD completo aziende clienti',
          'Gestione Dipendenti: Anagrafica completa con documenti e contratti',
          'Upload Documenti: Gestione documenti dipendenti con Supabase Storage'
        ]
      },
      {
        icon: ChartBarIcon,
        category: 'Dashboard e Infrastruttura',
        color: 'from-pink-500 to-rose-500',
        items: [
          'Dashboard: Analytics e statistiche in tempo reale',
          'RLS Policies: Isolamento dati multi-tenant',
          'Activity Logger: Sistema centralizzato logging attività',
          'Database Schema: 11 modelli principali con relazioni',
          'API Routes: Endpoints RESTful per tutte le risorse',
          'Validation: Zod schemas per validazione client e server',
          'TypeScript: Type safety completo su tutto il progetto'
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
                    <span className="px-3 py-1 bg-success text-success-foreground text-xs font-bold rounded-full">
                      NUOVE FUNZIONALITÀ
                    </span>
                  )}
                  {release.type === 'fix' && (
                    <span className="px-3 py-1 bg-warning text-warning-foreground text-xs font-bold rounded-full">
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
