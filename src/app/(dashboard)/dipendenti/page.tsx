import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DipendentiList from '@/components/dipendenti/dipendenti-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'

async function getDipendenti() {
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
    return []
  }

  // Query dipendenti con relazioni usando Prisma
  const dipendenti = await prisma.dipendente.findMany({
    where: {
      aziendaId: userData.aziendaId,
      attivo: true
    },
    include: {
      sede: {
        select: {
          id: true,
          nome: true
        }
      }
    },
    orderBy: { cognome: 'asc' }
  })

  // Transform the data to match the expected interface
  return dipendenti.map((dipendente: any) => ({
    ...dipendente,
    email: dipendente.email || '',
    telefono: dipendente.telefono || '',
    iban: dipendente.iban || '',
    dataCessazione: dipendente.dataCessazione || undefined,
    retribuzione: parseFloat(dipendente.retribuzione.toString()),
    sede: dipendente.sede || undefined
  }))
}

export default async function DipendentiPage() {
  const dipendenti = await getDipendenti()

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="flex justify-between items-center mb-8 animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent mb-2">
            👥 Dipendenti
          </h1>
          <p className="text-muted-foreground text-lg">Gestisci l&apos;anagrafica dei dipendenti</p>
        </div>
        <Link href="/dipendenti/nuovo">
          <Button className="flex items-center gap-2 button-scale shadow-lg hover:shadow-xl">
            <PlusIcon className="h-5 w-5" />
            Nuovo Dipendente
          </Button>
        </Link>
      </div>

      <DipendentiList dipendenti={dipendenti} />
    </div>
  )
}