import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  bustaPagaUpdateSchema,
  calcolaTotali,
} from "@/lib/validation/buste-paga-validator";

/**
 * GET /api/buste-paga/[id]
 * Recupera singola busta paga
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const userRecord = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true },
    });

    if (!userRecord?.aziendaId) {
      return NextResponse.json(
        { error: "Utente non associato a un'azienda" },
        { status: 403 }
      );
    }

    const bustaPaga = await prisma.buste_paga.findFirst({
      where: {
        id: params.id,
        dipendenti: {
          aziendaId: userRecord.aziendaId,
        },
      },
      include: {
        dipendenti: {
          include: {
            sedi: true,
          },
        },
      },
    });

    if (!bustaPaga) {
      return NextResponse.json(
        { error: "Busta paga non trovata" },
        { status: 404 }
      );
    }

    // Converti Decimal a number
    const bustaPagaFormatted = {
      ...bustaPaga,
      retribuzioneLorda: Number(bustaPaga.retribuzioneLorda),
      straordinari: Number(bustaPaga.straordinari),
      altreCompetenze: Number(bustaPaga.altreCompetenze),
      totaleLordo: Number(bustaPaga.totaleLordo),
      contributiINPS: Number(bustaPaga.contributiINPS),
      irpef: Number(bustaPaga.irpef),
      altreRitenute: Number(bustaPaga.altreRitenute),
      totaleRitenute: Number(bustaPaga.totaleRitenute),
      netto: Number(bustaPaga.netto),
      tfr: Number(bustaPaga.tfr),
      oreLavorate: Number(bustaPaga.oreLavorate),
      oreStraordinario: Number(bustaPaga.oreStraordinario),
      acconto1: bustaPaga.acconto1 ? Number(bustaPaga.acconto1) : 0,
      acconto2: bustaPaga.acconto2 ? Number(bustaPaga.acconto2) : 0,
      acconto3: bustaPaga.acconto3 ? Number(bustaPaga.acconto3) : 0,
      acconto4: bustaPaga.acconto4 ? Number(bustaPaga.acconto4) : 0,
      totaleAcconti: bustaPaga.totaleAcconti
        ? Number(bustaPaga.totaleAcconti)
        : 0,
      bonus: bustaPaga.bonus ? Number(bustaPaga.bonus) : 0,
      importoBonifico: bustaPaga.importoBonifico
        ? Number(bustaPaga.importoBonifico)
        : null,
      differenza: bustaPaga.differenza ? Number(bustaPaga.differenza) : null,
      dipendenti: {
        ...bustaPaga.dipendenti,
        retribuzione: Number(bustaPaga.dipendenti.retribuzione),
      },
    };

    return NextResponse.json(bustaPagaFormatted);
  } catch (error) {
    console.error("Errore nel recupero busta paga:", error);
    return NextResponse.json(
      { error: "Errore nel recupero della busta paga" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/buste-paga/[id]
 * Aggiorna busta paga esistente
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const userRecord = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true },
    });

    if (!userRecord?.aziendaId) {
      return NextResponse.json(
        { error: "Utente non associato a un'azienda" },
        { status: 403 }
      );
    }

    // Verifica che la busta paga esista e appartenga all'azienda
    const bustaPagaEsistente = await prisma.buste_paga.findFirst({
      where: {
        id: params.id,
        dipendenti: {
          aziendaId: userRecord.aziendaId,
        },
      },
    });

    if (!bustaPagaEsistente) {
      return NextResponse.json(
        { error: "Busta paga non trovata" },
        { status: 404 }
      );
    }

    // Parse body
    const body = await request.json();
    const validatedData = bustaPagaUpdateSchema.parse({ ...body, id: params.id });

    // Ricalcola i totali se necessario
    const datiAggiornati = calcolaTotali({
      ...bustaPagaEsistente,
      ...validatedData,
      retribuzioneLorda: validatedData.retribuzioneLorda
        ? Number(validatedData.retribuzioneLorda)
        : Number(bustaPagaEsistente.retribuzioneLorda),
      straordinari: validatedData.straordinari
        ? Number(validatedData.straordinari)
        : Number(bustaPagaEsistente.straordinari),
      altreCompetenze: validatedData.altreCompetenze
        ? Number(validatedData.altreCompetenze)
        : Number(bustaPagaEsistente.altreCompetenze),
      contributiINPS: validatedData.contributiINPS
        ? Number(validatedData.contributiINPS)
        : Number(bustaPagaEsistente.contributiINPS),
      irpef: validatedData.irpef
        ? Number(validatedData.irpef)
        : Number(bustaPagaEsistente.irpef),
      altreRitenute: validatedData.altreRitenute
        ? Number(validatedData.altreRitenute)
        : Number(bustaPagaEsistente.altreRitenute),
      tfr: validatedData.tfr
        ? Number(validatedData.tfr)
        : Number(bustaPagaEsistente.tfr),
      acconto1: validatedData.acconto1 ?? (bustaPagaEsistente.acconto1 ? Number(bustaPagaEsistente.acconto1) : 0),
      acconto2: validatedData.acconto2 ?? (bustaPagaEsistente.acconto2 ? Number(bustaPagaEsistente.acconto2) : 0),
      acconto3: validatedData.acconto3 ?? (bustaPagaEsistente.acconto3 ? Number(bustaPagaEsistente.acconto3) : 0),
      acconto4: validatedData.acconto4 ?? (bustaPagaEsistente.acconto4 ? Number(bustaPagaEsistente.acconto4) : 0),
      bonus: validatedData.bonus ?? (bustaPagaEsistente.bonus ? Number(bustaPagaEsistente.bonus) : 0),
    });

    // Aggiorna busta paga
    const bustaPagaAggiornata = await prisma.buste_paga.update({
      where: { id: params.id },
      data: {
        ...(validatedData.retribuzioneLorda && {
          retribuzioneLorda: validatedData.retribuzioneLorda,
        }),
        ...(validatedData.straordinari !== undefined && {
          straordinari: validatedData.straordinari,
        }),
        ...(validatedData.altreCompetenze !== undefined && {
          altreCompetenze: validatedData.altreCompetenze,
        }),
        totaleLordo: datiAggiornati.totaleLordo!,
        ...(validatedData.contributiINPS !== undefined && {
          contributiINPS: validatedData.contributiINPS,
        }),
        ...(validatedData.irpef !== undefined && {
          irpef: validatedData.irpef,
        }),
        ...(validatedData.altreRitenute !== undefined && {
          altreRitenute: validatedData.altreRitenute,
        }),
        totaleRitenute: datiAggiornati.totaleRitenute!,
        netto: datiAggiornati.netto!,
        ...(validatedData.tfr !== undefined && { tfr: validatedData.tfr }),
        ...(validatedData.oreLavorate !== undefined && {
          oreLavorate: validatedData.oreLavorate,
        }),
        ...(validatedData.oreStraordinario !== undefined && {
          oreStraordinario: validatedData.oreStraordinario,
        }),
        ...(validatedData.acconto1 !== undefined && {
          acconto1: validatedData.acconto1,
        }),
        ...(validatedData.acconto2 !== undefined && {
          acconto2: validatedData.acconto2,
        }),
        ...(validatedData.acconto3 !== undefined && {
          acconto3: validatedData.acconto3,
        }),
        ...(validatedData.acconto4 !== undefined && {
          acconto4: validatedData.acconto4,
        }),
        totaleAcconti: datiAggiornati.totaleAcconti!,
        ...(validatedData.bonus !== undefined && { bonus: validatedData.bonus }),
        importoBonifico: datiAggiornati.netto!,
        differenza: datiAggiornati.differenza!,
        ...(validatedData.note !== undefined && { note: validatedData.note }),
      },
      include: {
        dipendenti: {
          include: {
            sedi: true,
          },
        },
      },
    });

    // TODO: Activity logging
    // await AttivitaLogger.logModificaBustaPaga(...)

    // Converti Decimal a number
    const bustaPagaFormatted = {
      ...bustaPagaAggiornata,
      retribuzioneLorda: Number(bustaPagaAggiornata.retribuzioneLorda),
      straordinari: Number(bustaPagaAggiornata.straordinari),
      altreCompetenze: Number(bustaPagaAggiornata.altreCompetenze),
      totaleLordo: Number(bustaPagaAggiornata.totaleLordo),
      contributiINPS: Number(bustaPagaAggiornata.contributiINPS),
      irpef: Number(bustaPagaAggiornata.irpef),
      altreRitenute: Number(bustaPagaAggiornata.altreRitenute),
      totaleRitenute: Number(bustaPagaAggiornata.totaleRitenute),
      netto: Number(bustaPagaAggiornata.netto),
      tfr: Number(bustaPagaAggiornata.tfr),
      oreLavorate: Number(bustaPagaAggiornata.oreLavorate),
      oreStraordinario: Number(bustaPagaAggiornata.oreStraordinario),
      acconto1: bustaPagaAggiornata.acconto1
        ? Number(bustaPagaAggiornata.acconto1)
        : 0,
      acconto2: bustaPagaAggiornata.acconto2
        ? Number(bustaPagaAggiornata.acconto2)
        : 0,
      acconto3: bustaPagaAggiornata.acconto3
        ? Number(bustaPagaAggiornata.acconto3)
        : 0,
      acconto4: bustaPagaAggiornata.acconto4
        ? Number(bustaPagaAggiornata.acconto4)
        : 0,
      totaleAcconti: bustaPagaAggiornata.totaleAcconti
        ? Number(bustaPagaAggiornata.totaleAcconti)
        : 0,
      bonus: bustaPagaAggiornata.bonus ? Number(bustaPagaAggiornata.bonus) : 0,
      importoBonifico: bustaPagaAggiornata.importoBonifico
        ? Number(bustaPagaAggiornata.importoBonifico)
        : null,
      differenza: bustaPagaAggiornata.differenza
        ? Number(bustaPagaAggiornata.differenza)
        : null,
      dipendenti: {
        ...bustaPagaAggiornata.dipendenti,
        retribuzione: Number(bustaPagaAggiornata.dipendenti.retribuzione),
      },
    };

    return NextResponse.json(bustaPagaFormatted);
  } catch (error) {
    console.error("Errore nell'aggiornamento busta paga:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Errore nell'aggiornamento della busta paga" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/buste-paga/[id]
 * Elimina busta paga
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const userRecord = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true },
    });

    if (!userRecord?.aziendaId) {
      return NextResponse.json(
        { error: "Utente non associato a un'azienda" },
        { status: 403 }
      );
    }

    // Verifica che la busta paga esista e appartenga all'azienda
    const bustaPaga = await prisma.buste_paga.findFirst({
      where: {
        id: params.id,
        dipendenti: {
          aziendaId: userRecord.aziendaId,
        },
      },
    });

    if (!bustaPaga) {
      return NextResponse.json(
        { error: "Busta paga non trovata" },
        { status: 404 }
      );
    }

    // Elimina busta paga
    await prisma.buste_paga.delete({
      where: { id: params.id },
    });

    // TODO: Activity logging
    // await AttivitaLogger.logEliminazioneBustaPaga(...)

    return NextResponse.json(
      { message: "Busta paga eliminata con successo" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore nell'eliminazione busta paga:", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione della busta paga" },
      { status: 500 }
    );
  }
}
