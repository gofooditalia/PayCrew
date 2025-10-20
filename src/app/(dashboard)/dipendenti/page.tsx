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
  return dipendenti.map(dipendente => ({
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dipendenti</h1>
          <p className="text-gray-600">Gestisci l&apos;anagrafica dei dipendenti</p>
        </div>
        <Link href="/dipendenti/nuovo">
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Nuovo Dipendente
          </Button>
        </Link>
      </div>

      <DipendentiList dipendenti={dipendenti} />
    </div>
  )
}