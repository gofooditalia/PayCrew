import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserGroupIcon, ClockIcon, DocumentTextIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline'

async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Ottieni l'azienda dell'utente
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { aziendaId: true }
  })

  if (!userData?.aziendaId) {
    return {
      totalDipendenti: 0,
      presenzeOggi: 0,
      bustePagaMese: 0,
      totaleSalari: 0
    }
  }

  // Calcola le statistiche
  const [
    totalDipendenti,
    presenzeOggi,
    bustePagaMese,
    totaleSalari
  ] = await Promise.all([
    prisma.dipendente.count({
      where: { 
        aziendaId: userData.aziendaId,
        attivo: true 
      }
    }),
    prisma.presenza.count({
      where: { 
        dipendente: { aziendaId: userData.aziendaId },
        data: new Date()
      }
    }),
    prisma.bustaPaga.count({
      where: { 
        dipendente: { aziendaId: userData.aziendaId },
        mese: new Date().getMonth() + 1,
        anno: new Date().getFullYear()
      }
    }),
    prisma.dipendente.aggregate({
      where: { 
        aziendaId: userData.aziendaId,
        attivo: true 
      },
      _sum: { retribuzione: true }
    })
  ])

  return {
    totalDipendenti,
    presenzeOggi,
    bustePagaMese,
    totaleSalari: totaleSalari._sum.retribuzione || 0
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Benvenuto nel gestionale PayCrew</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dipendenti Totali</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDipendenti}</div>
            <p className="text-xs text-muted-foreground">
              Dipendenti attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presenze Oggi</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presenzeOggi}</div>
            <p className="text-xs text-muted-foreground">
              Registrazioni odierna
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buste Paga</CardTitle>
            <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bustePagaMese}</div>
            <p className="text-xs text-muted-foreground">
              Questo mese
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Massa Salariale</CardTitle>
            <CurrencyEuroIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{stats.totaleSalari.toLocaleString('it-IT')}
            </div>
            <p className="text-xs text-muted-foreground">
              Mensile
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/dipendenti/nuovo"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Nuovo Dipendente</h3>
                <p className="text-sm text-gray-600">Aggiungi un nuovo dipendente</p>
              </a>
              <a
                href="/presenze"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Registra Presenza</h3>
                <p className="text-sm text-gray-600">Inserisci presenza giornaliera</p>
              </a>
              <a
                href="/buste-paga"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Genera Busta Paga</h3>
                <p className="text-sm text-gray-600">Crea nuovo cedolino</p>
              </a>
              <a
                href="/report"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Visualizza Report</h3>
                <p className="text-sm text-gray-600">Analisi e statistiche</p>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attività Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nessuna attività recente</p>
                  <p className="text-xs text-gray-600">Le attività appariranno qui</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}