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
    <div className="min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Benvenuto nel gestionale PayCrew</p>
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
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dipendenti Totali</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalDipendenti}</div>
            <p className="text-sm text-muted-foreground">
              Dipendenti attivi
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presenze Oggi</CardTitle>
            <ClockIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.presenzeOggi}</div>
            <p className="text-sm text-muted-foreground">
              Registrazioni odierna
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Buste Paga</CardTitle>
            <DocumentTextIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.bustePagaMese}</div>
            <p className="text-sm text-muted-foreground">
              Questo mese
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Massa Salariale</CardTitle>
            <CurrencyEuroIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.totaleSalari)}
            </div>
            <p className="text-sm text-muted-foreground">
              Mensile
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/dipendenti/nuovo"
                className="p-4 border border-border rounded-lg hover:bg-accent transition-all duration-200"
              >
                <h3 className="font-medium text-foreground">Nuovo Dipendente</h3>
                <p className="text-sm text-muted-foreground mt-1">Aggiungi un nuovo dipendente</p>
              </Link>
              <Link
                href="/presenze"
                className="p-4 border border-border rounded-lg hover:bg-accent transition-all duration-200"
              >
                <h3 className="font-medium text-foreground">Registra Presenza</h3>
                <p className="text-sm text-muted-foreground mt-1">Inserisci presenza giornaliera</p>
              </Link>
              <Link
                href="/buste-paga"
                className="p-4 border border-border rounded-lg hover:bg-accent transition-all duration-200"
              >
                <h3 className="font-medium text-foreground">Genera Busta Paga</h3>
                <p className="text-sm text-muted-foreground mt-1">Crea nuovo cedolino</p>
              </Link>
              <Link
                href="/report"
                className="p-4 border border-border rounded-lg hover:bg-accent transition-all duration-200"
              >
                <h3 className="font-medium text-foreground">Visualizza Report</h3>
                <p className="text-sm text-muted-foreground mt-1">Analisi e statistiche</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        <AttivitaRecenti limit={5} />
      </div>
    </div>
  )
}