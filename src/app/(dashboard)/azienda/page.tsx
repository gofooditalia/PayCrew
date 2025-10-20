'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AziendaPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user has a company and redirect accordingly
    const checkUserCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // For now, just redirect to the creation page
      // In a real app, you might check if the user has a company
      router.push('/azienda/crea')
    }

    checkUserCompany()
  }, [router, supabase])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Configurazione Azienda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            &Egrave; necessario configurare un&apos;azienda per continuare.
          </p>
          <div className="flex justify-center">
            <Link href="/azienda/crea">
              <Button>Configura Azienda</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}