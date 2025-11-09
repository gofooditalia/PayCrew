import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET - Report collaboratori per commercialista
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const dataInizio = searchParams.get('dataInizio')
    const dataFine = searchParams.get('dataFine')
    const collaboratoreId = searchParams.get('collaboratoreId')
    const tipo = searchParams.get('tipo')
    const statoPagamento = searchParams.get('statoPagamento')

    const where: any = {
      aziendaId: userData.aziendaId,
    }

    if (collaboratoreId) {
      where.collaboratoreId = collaboratoreId
    }

    if (tipo) {
      where.tipo = tipo
    }

    if (statoPagamento) {
      where.statoPagamento = statoPagamento
    }

    if (dataInizio || dataFine) {
      where.dataInizio = {}
      if (dataInizio) {
        where.dataInizio.gte = new Date(dataInizio)
      }
      if (dataFine) {
        where.dataInizio.lte = new Date(dataFine)
      }
    }

    const prestazioni = await prisma.prestazioni.findMany({
      where,
      include: {
        collaboratori: {
          select: {
            nome: true,
            cognome: true,
            codiceFiscale: true,
            partitaIva: true,
            tipo: true,
          }
        }
      },
      orderBy: [
        { dataInizio: 'desc' },
        { collaboratori: { cognome: 'asc' } }
      ],
    })

    // Converti Decimal a Number e prepara dati per report
    const prestazioniFormatted = prestazioni.map(p => ({
      id: p.id,
      collaboratoreNome: `${p.collaboratori.nome} ${p.collaboratori.cognome}`,
      codiceFiscale: p.collaboratori.codiceFiscale,
      partitaIva: p.collaboratori.partitaIva || '',
      tipoCollaboratore: p.collaboratori.tipo,
      tipoPrestazione: p.tipo,
      descrizione: p.descrizione,
      dataInizio: p.dataInizio,
      dataFine: p.dataFine,
      nomeProgetto: p.nomeProgetto || '',
      oreLavorate: p.oreLavorate ? Number(p.oreLavorate) : null,
      tariffaOraria: p.tariffaOraria ? Number(p.tariffaOraria) : null,
      compensoFisso: p.compensoFisso ? Number(p.compensoFisso) : null,
      importoTotale: Number(p.importoTotale),
      statoPagamento: p.statoPagamento,
      dataPagamento: p.dataPagamento,
      note: p.note || '',
    }))

    // Calcola statistiche
    const totaleImporto = prestazioniFormatted.reduce((acc, p) => acc + p.importoTotale, 0)
    const totaleDaPagare = prestazioniFormatted
      .filter(p => p.statoPagamento === 'DA_PAGARE')
      .reduce((acc, p) => acc + p.importoTotale, 0)
    const totalePagato = prestazioniFormatted
      .filter(p => p.statoPagamento === 'PAGATO')
      .reduce((acc, p) => acc + p.importoTotale, 0)

    // Statistiche per tipo collaboratore
    const perTipo = prestazioniFormatted.reduce((acc, p) => {
      if (!acc[p.tipoCollaboratore]) {
        acc[p.tipoCollaboratore] = {
          count: 0,
          totale: 0,
        }
      }
      acc[p.tipoCollaboratore].count++
      acc[p.tipoCollaboratore].totale += p.importoTotale
      return acc
    }, {} as Record<string, { count: number; totale: number }>)

    return NextResponse.json({
      prestazioni: prestazioniFormatted,
      statistiche: {
        totalePrestazioni: prestazioniFormatted.length,
        totaleImporto,
        totaleDaPagare,
        totalePagato,
        perTipo,
      },
      filtri: {
        dataInizio,
        dataFine,
        collaboratoreId,
        tipo,
        statoPagamento,
      }
    })
  } catch (error) {
    console.error('Errore GET /api/report/collaboratori:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
