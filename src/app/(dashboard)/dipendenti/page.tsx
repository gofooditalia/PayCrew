import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DipendentiList from '@/components/dipendenti/dipendenti-list'

async function getDipendenti() {
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

  // Query dipendenti con relazioni usando Prisma
  const dipendenti = await prisma.dipendenti.findMany({
    where: {
      aziendaId: userData.aziendaId,
      attivo: true
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
    retribuzione: parseFloat(dipendente.retribuzione.toString()),
    sede: dipendente.sedi || undefined
  }))
}

export default async function DipendentiPage() {
  const dipendenti = await getDipendenti()

  return (
    <div className="min-h-screen animate-fade-in">
      <DipendentiList dipendenti={dipendenti} />
    </div>
  )
}