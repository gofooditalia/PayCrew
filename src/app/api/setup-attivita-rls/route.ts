import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Enable RLS on the attivita table
    await prisma.$executeRawUnsafe(`ALTER TABLE attivita ENABLE ROW LEVEL SECURITY`)

    // Create policy for users to see their own company's activities
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can view their company activities" ON attivita
      FOR SELECT USING (
        "aziendaId" IN (
          SELECT "aziendaId" FROM users WHERE id = auth.uid()
        )
      )
    `)

    // Create policy for users to insert activities for their company
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can insert activities for their company" ON attivita
      FOR INSERT WITH CHECK (
        "aziendaId" IN (
          SELECT "aziendaId" FROM users WHERE id = auth.uid()
        )
      )
    `)

    // Create policy for users to update their own company's activities
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can update their company activities" ON attivita
      FOR UPDATE USING (
        "aziendaId" IN (
          SELECT "aziendaId" FROM users WHERE id = auth.uid()
        )
      )
    `)

    // Create policy for users to delete their own company's activities
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can delete their company activities" ON attivita
      FOR DELETE USING (
        "aziendaId" IN (
          SELECT "aziendaId" FROM users WHERE id = auth.uid()
        )
      )
    `)

    return NextResponse.json({ 
      message: 'RLS enabled and policies created for attivita table' 
    })

  } catch (error) {
    console.error('Errore durante il setup RLS per attivita:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il setup RLS',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}