import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, ...aziendaData } = await request.json()

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'ID utente e email sono richiesti' },
        { status: 400 }
      )
    }

    // Verifica se l'utente esiste già
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (existingUser && existingUser.aziendaId) {
      return NextResponse.json({
        message: 'Utente già associato a un\'azienda',
        user: existingUser
      })
    }

    // Rimuovi il campo provincia dai dati se presente
    const { provincia, ...aziendaDataFiltered } = aziendaData
    void provincia // Marca come usato per evitare warning ESLint

    // Crea l'azienda usando Prisma
    const azienda = await prisma.aziende.create({
      data: aziendaDataFiltered
    })

    // Crea o aggiorna l'utente associato all'azienda
    const user = await prisma.users.upsert({
      where: { id: userId },
      update: {
        email: userEmail,
        role: 'ADMIN',
        aziendaId: azienda.id
      },
      create: {
        id: userId,
        email: userEmail,
        role: 'ADMIN',
        aziendaId: azienda.id
      }
    })

    // Crea la sede principale
    await prisma.sedi.create({
      data: {
        nome: 'Sede Principale',
        indirizzo: aziendaDataFiltered.indirizzo || '',
        citta: aziendaDataFiltered.citta || '',
        aziendaId: azienda.id
      }
    })

    return NextResponse.json({
      message: 'Azienda creata con successo',
      azienda,
      user
    })

  } catch (error) {
    console.error('Errore durante la creazione dell\'azienda:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante la creazione dell\'azienda',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}