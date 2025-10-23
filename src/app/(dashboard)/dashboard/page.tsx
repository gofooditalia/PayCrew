import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserGroupIcon, ClockIcon, DocumentTextIcon, CurrencyEuroIcon, PencilIcon } from '@heroicons/react/24/outline'
import { AttivitaRecenti } from '@/components/attivita/attivita-recenti'
import { formatCurrency } from '@/lib/utils/currency'
import Link from 'next/link'

async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Ottieni l'azienda dell'utente usando Prisma
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

  // Calcola le statistiche usando Prisma
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
    totaleSalari: parseFloat((totaleSalari._sum.retribuzione || 0).toString())
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mobile-text-secondary">Benvenuto nel gestionale PayCrew</p>
        </div>
        <Link href="/azienda/modifica">
          <Button variant="outline" className="flex items-center">
            <PencilIcon className="h-4 w-4 mr-2" />
            Modifica Azienda
          </Button>
        </Link>
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
            <p className="text-sm mobile-text-muted">
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
            <p className="text-sm mobile-text-muted">
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
            <p className="text-sm mobile-text-muted">
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
              {formatCurrency(stats.totaleSalari)}
            </div>
            <p className="text-sm mobile-text-muted">
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
              <Link
                href="/dipendenti/nuovo"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Nuovo Dipendente</h3>
                <p className="text-sm mobile-text-secondary">Aggiungi un nuovo dipendente</p>
              </Link>
              <Link
                href="/presenze"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Registra Presenza</h3>
                <p className="text-sm mobile-text-secondary">Inserisci presenza giornaliera</p>
              </Link>
              <Link
                href="/buste-paga"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Genera Busta Paga</h3>
                <p className="text-sm mobile-text-secondary">Crea nuovo cedolino</p>
              </Link>
              <Link
                href="/report"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">Visualizza Report</h3>
                <p className="text-sm mobile-text-secondary">Analisi e statistiche</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        <AttivitaRecenti limit={5} />
      </div>
    </div>
  )
}