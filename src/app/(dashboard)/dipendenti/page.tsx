import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DipendentiList from '@/components/dipendenti/dipendenti-list'

async function getDipendenti(statoFiltro?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ottieni l'azienda dell'utente usando Prisma
  const userData = await prisma.users.findUnique({
    where: { id: user.id },
    select: { aziendaId: true }
  })

  if (!userData?.aziendaId) {
    return []
  }

  // Costruisci il filtro per lo stato
  const statoFilter = statoFiltro === 'tutti'
    ? {}
    : statoFiltro === 'non_attivi'
    ? { attivo: false }
    : { attivo: true } // default: solo attivi

  // Query dipendenti con relazioni usando Prisma
  const dipendenti = await prisma.dipendenti.findMany({
    where: {
      aziendaId: userData.aziendaId,
      ...statoFilter
    },
    include: {
      sedi: {
        select: {
          id: true,
          nome: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Transform the data to match the expected interface
  return dipendenti.map((dipendente: any) => ({
    ...dipendente,
    email: dipendente.email || '',
    telefono: dipendente.telefono || '',
    iban: dipendente.iban || '',
    dataCessazione: dipendente.dataCessazione || undefined,
    retribuzione: dipendente.retribuzione ? parseFloat(dipendente.retribuzione.toString()) : null,
    retribuzioneNetta: dipendente.retribuzioneNetta ? parseFloat(dipendente.retribuzioneNetta.toString()) : null,
    limiteContanti: dipendente.limiteContanti ? parseFloat(dipendente.limiteContanti.toString()) : null,
    limiteBonifico: dipendente.limiteBonifico ? parseFloat(dipendente.limiteBonifico.toString()) : null,
    coefficienteMaggiorazione: dipendente.coefficienteMaggiorazione ? parseFloat(dipendente.coefficienteMaggiorazione.toString()) : 0,
    sede: dipendente.sedi || undefined
  }))
}

export default async function DipendentiPage({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string }>
}) {
  const params = await searchParams
  const dipendenti = await getDipendenti(params.stato)

  return (
    <div className="min-h-screen animate-fade-in">
      <DipendentiList dipendenti={dipendenti} statoFiltro={params.stato || 'attivi'} />
    </div>
  )
}