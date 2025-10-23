import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Query to get column information from the attivita table
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'attivita' 
      ORDER BY ordinal_position
    `)

    return NextResponse.json({ columns: result })
  } catch (error) {
    console.error('Errore durante il debug della tabella attivita:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il debug',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}