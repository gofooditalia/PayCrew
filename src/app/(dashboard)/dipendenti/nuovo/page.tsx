import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DipendenteForm from '@/components/dipendenti/dipendente-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

async function getSedi() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Ottieni l'azienda dell'utente
  const { data: userData } = await supabase
    .from('users')
    .select('aziendaId')
    .eq('id', user.id)
    .single()

  if (!userData?.aziendaId) {
    return []
  }

  // Query sedi dell'azienda
  const { data: sedi } = await supabase
    .from('sedi')
    .select('id, nome')
    .eq('aziendaId', userData.aziendaId)
    .order('nome', { ascending: true })

  return sedi || []
}

export default async function NuovoDipendentePage() {
  const sedi = await getSedi()

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/dipendenti">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuovo Dipendente</h1>
          <p className="text-gray-600">Aggiungi un nuovo dipendente al sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni Dipendente</CardTitle>
        </CardHeader>
        <CardContent>
          <DipendenteForm sedi={sedi} />
        </CardContent>
      </Card>
    </div>
  )
}