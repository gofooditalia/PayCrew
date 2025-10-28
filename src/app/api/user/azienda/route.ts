import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non autenticato' },
        { status: 401 }
      )
    }

    // Get user's company using Prisma
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json(
        { error: 'Nessuna azienda associata all\'utente' },
        { status: 404 }
      )
    }

    // Get company details
    const azienda = await prisma.aziende.findUnique({
      where: { id: userData.aziendaId },
      select: {
        id: true,
        nome: true,
        partitaIva: true,
        codiceFiscale: true,
        indirizzo: true,
        citta: true,
        cap: true,
        email: true,
        telefono: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!azienda) {
      return NextResponse.json(
        { error: 'Azienda non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json({ azienda })

  } catch (error) {
    console.error('Errore durante il recupero dell\'azienda:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il recupero dell\'azienda',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}