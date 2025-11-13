import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/pagamenti - Get pagamenti for a specific dipendente
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Get user's company
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const dipendenteId = searchParams.get('dipendenteId')
    const mese = searchParams.get('mese')
    const anno = searchParams.get('anno')

    // Build where clause
    const where: any = {
      aziendaId: userData.aziendaId
    }

    if (dipendenteId) {
      where.dipendenteId = dipendenteId
    }

    // Filter by mese and anno (new approach)
    if (mese && anno) {
      where.mese = parseInt(mese)
      where.anno = parseInt(anno)
    }

    const pagamenti = await prisma.pagamenti_dipendenti.findMany({
      where,
      include: {
        dipendenti: {
          select: {
            id: true,
            nome: true,
            cognome: true
          }
        }
      },
      orderBy: {
        dataPagamento: 'desc'
      }
    })

    // Convert Decimal to number for JSON serialization
    const serializedPagamenti = pagamenti.map(p => ({
      ...p,
      importo: Number(p.importo)
    }))

    return NextResponse.json(serializedPagamenti)
  } catch (error) {
    console.error('Error fetching pagamenti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei pagamenti' },
      { status: 500 }
    )
  }
}

// POST /api/pagamenti - Create a new pagamento
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Get user's company
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const body = await request.json()
    const { importo, tipoPagamento, dataPagamento, note, dipendenteId, bustaPagaId } = body

    // Validate required fields
    if (!importo || !tipoPagamento || !dataPagamento || !dipendenteId) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      )
    }

    // Calcola mese e anno dal mese corrente (sempre automatico)
    const now = new Date()
    const mese = now.getMonth() + 1 // JavaScript months are 0-indexed
    const anno = now.getFullYear()

    // Verify dipendente belongs to user's company
    const dipendente = await prisma.dipendenti.findFirst({
      where: {
        id: dipendenteId,
        aziendaId: userData.aziendaId
      }
    })

    if (!dipendente) {
      return NextResponse.json(
        { error: 'Dipendente non trovato' },
        { status: 404 }
      )
    }

    // Create pagamento
    const pagamento = await prisma.pagamenti_dipendenti.create({
      data: {
        importo: parseFloat(importo),
        tipoPagamento,
        dataPagamento: new Date(dataPagamento),
        mese,
        anno,
        note: note || null,
        dipendenteId,
        bustaPagaId: bustaPagaId || null,
        aziendaId: userData.aziendaId
      },
      include: {
        dipendenti: {
          select: {
            id: true,
            nome: true,
            cognome: true
          }
        }
      }
    })

    // Convert Decimal to number
    const serializedPagamento = {
      ...pagamento,
      importo: Number(pagamento.importo)
    }

    return NextResponse.json(serializedPagamento, { status: 201 })
  } catch (error) {
    console.error('Error creating pagamento:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del pagamento' },
      { status: 500 }
    )
  }
}
