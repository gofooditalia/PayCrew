import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  bustaPagaQuickSchema,
  bustaPagaQuerySchema,
  calcolaTotali,
} from "@/lib/validation/buste-paga-validator";
import { Prisma } from "@prisma/client";

/**
 * GET /api/buste-paga
 * Recupera lista buste paga con filtri opzionali
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    // Recupera info utente per aziendaId
    const userRecord = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true, role: true },
    });

    if (!userRecord?.aziendaId) {
      return NextResponse.json(
        { error: "Utente non associato a un'azienda" },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const queryParams = {
      dipendenteId: searchParams.get("dipendenteId") || undefined,
      mese: searchParams.get("mese")
        ? parseInt(searchParams.get("mese")!)
        : undefined,
      anno: searchParams.get("anno")
        ? parseInt(searchParams.get("anno")!)
        : undefined,
      sedeId: searchParams.get("sedeId") || undefined,
    };

    // Valida query params
    const validatedQuery = bustaPagaQuerySchema.parse(queryParams);

    // Build where clause
    const where: Prisma.buste_pagaWhereInput = {
      dipendenti: {
        aziendaId: userRecord.aziendaId,
        ...(validatedQuery.sedeId && { sedeId: validatedQuery.sedeId }),
      },
      ...(validatedQuery.dipendenteId && {
        dipendenteId: validatedQuery.dipendenteId,
      }),
      ...(validatedQuery.mese && { mese: validatedQuery.mese }),
      ...(validatedQuery.anno && { anno: validatedQuery.anno }),
    };

    // Query database
    const bustePaga = await prisma.buste_paga.findMany({
      where,
      include: {
        dipendenti: {
          include: {
            sedi: true,
          },
        },
      },
      orderBy: [{ anno: "desc" }, { mese: "desc" }],
    });

    // Converti Decimal a number per JSON
    const bustePagaFormatted = bustePaga.map((bp) => ({
      ...bp,
      retribuzioneLorda: Number(bp.retribuzioneLorda),
      straordinari: Number(bp.straordinari),
      altreCompetenze: Number(bp.altreCompetenze),
      totaleLordo: Number(bp.totaleLordo),
      contributiINPS: Number(bp.contributiINPS),
      irpef: Number(bp.irpef),
      altreRitenute: Number(bp.altreRitenute),
      totaleRitenute: Number(bp.totaleRitenute),
      netto: Number(bp.netto),
      tfr: Number(bp.tfr),
      oreLavorate: Number(bp.oreLavorate),
      oreStraordinario: Number(bp.oreStraordinario),
      acconto1: bp.acconto1 ? Number(bp.acconto1) : 0,
      acconto2: bp.acconto2 ? Number(bp.acconto2) : 0,
      acconto3: bp.acconto3 ? Number(bp.acconto3) : 0,
      acconto4: bp.acconto4 ? Number(bp.acconto4) : 0,
      totaleAcconti: bp.totaleAcconti ? Number(bp.totaleAcconti) : 0,
      bonus: bp.bonus ? Number(bp.bonus) : 0,
      importoBonifico: bp.importoBonifico ? Number(bp.importoBonifico) : null,
      differenza: bp.differenza ? Number(bp.differenza) : null,
      dipendenti: {
        ...bp.dipendenti,
        retribuzione: Number(bp.dipendenti.retribuzione),
      },
    }));

    return NextResponse.json(bustePagaFormatted);
  } catch (error) {
    console.error("Errore nel recupero buste paga:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Errore nel recupero delle buste paga" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/buste-paga
 * Crea nuova busta paga
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    // Recupera info utente
    const userRecord = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true, role: true },
    });

    if (!userRecord?.aziendaId) {
      return NextResponse.json(
        { error: "Utente non associato a un'azienda" },
        { status: 403 }
      );
    }

    // Parse body
    const body = await request.json();
    const validatedData = bustaPagaQuickSchema.parse(body);

    // Verifica che il dipendente appartenga all'azienda
    const dipendente = await prisma.dipendenti.findFirst({
      where: {
        id: validatedData.dipendenteId,
        aziendaId: userRecord.aziendaId,
      },
    });

    if (!dipendente) {
      return NextResponse.json(
        { error: "Dipendente non trovato o non autorizzato" },
        { status: 404 }
      );
    }

    // Verifica se esiste già una busta paga per questo mese/anno
    const esistente = await prisma.buste_paga.findFirst({
      where: {
        dipendenteId: validatedData.dipendenteId,
        mese: validatedData.mese,
        anno: validatedData.anno,
      },
    });

    if (esistente) {
      return NextResponse.json(
        { error: "Esiste già una busta paga per questo periodo" },
        { status: 409 }
      );
    }

    // Calcola importo straordinari se presenti ore straordinarie
    // Formula: (retribuzione / ore mensili standard) * ore straordinarie * maggiorazione (25%)
    const oreMensiliStandard = (dipendente.oreSettimanali / 5) * 4.33 // media settimane/mese
    const tariffaOraria = validatedData.retribuzioneLorda / oreMensiliStandard
    const oreStraordinario = validatedData.oreStraordinario || 0
    const importoStraordinari = oreStraordinario > 0
      ? Math.round(tariffaOraria * oreStraordinario * 1.25 * 100) / 100 // 25% maggiorazione
      : 0

    // Calcola i totali automaticamente
    const datiCompleti = calcolaTotali({
      ...validatedData,
      retribuzioneLorda: validatedData.retribuzioneLorda,
      straordinari: importoStraordinari,
      altreCompetenze: 0,
      contributiINPS: validatedData.retribuzioneLorda * 0.0919, // 9.19% esempio
      irpef: validatedData.retribuzioneLorda * 0.23, // 23% esempio (da personalizzare)
      altreRitenute: 0,
      tfr: validatedData.retribuzioneLorda * 0.0691, // 6.91% TFR
      oreLavorate: validatedData.oreLavorate,
      oreStraordinario: oreStraordinario,
    });

    // Crea busta paga
    const nuovaBustaPaga = await prisma.buste_paga.create({
      data: {
        dipendenteId: validatedData.dipendenteId,
        mese: validatedData.mese,
        anno: validatedData.anno,
        retribuzioneLorda: datiCompleti.retribuzioneLorda!,
        straordinari: datiCompleti.straordinari!,
        altreCompetenze: datiCompleti.altreCompetenze!,
        totaleLordo: datiCompleti.totaleLordo!,
        contributiINPS: datiCompleti.contributiINPS!,
        irpef: datiCompleti.irpef!,
        altreRitenute: datiCompleti.altreRitenute!,
        totaleRitenute: datiCompleti.totaleRitenute!,
        netto: datiCompleti.netto!,
        tfr: datiCompleti.tfr!,
        oreLavorate: datiCompleti.oreLavorate!,
        oreStraordinario: datiCompleti.oreStraordinario!,
        acconto1: validatedData.acconto1,
        acconto2: validatedData.acconto2,
        acconto3: validatedData.acconto3,
        acconto4: validatedData.acconto4,
        totaleAcconti: datiCompleti.totaleAcconti,
        bonus: validatedData.bonus,
        importoBonifico: datiCompleti.netto,
        differenza: datiCompleti.differenza,
        note: validatedData.note,
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
    // await AttivitaLogger.logGenerazioneBustaPaga(...)

    // Converti Decimal a number
    const bustaPagaFormatted = {
      ...nuovaBustaPaga,
      retribuzioneLorda: Number(nuovaBustaPaga.retribuzioneLorda),
      straordinari: Number(nuovaBustaPaga.straordinari),
      altreCompetenze: Number(nuovaBustaPaga.altreCompetenze),
      totaleLordo: Number(nuovaBustaPaga.totaleLordo),
      contributiINPS: Number(nuovaBustaPaga.contributiINPS),
      irpef: Number(nuovaBustaPaga.irpef),
      altreRitenute: Number(nuovaBustaPaga.altreRitenute),
      totaleRitenute: Number(nuovaBustaPaga.totaleRitenute),
      netto: Number(nuovaBustaPaga.netto),
      tfr: Number(nuovaBustaPaga.tfr),
      oreLavorate: Number(nuovaBustaPaga.oreLavorate),
      oreStraordinario: Number(nuovaBustaPaga.oreStraordinario),
      acconto1: nuovaBustaPaga.acconto1 ? Number(nuovaBustaPaga.acconto1) : 0,
      acconto2: nuovaBustaPaga.acconto2 ? Number(nuovaBustaPaga.acconto2) : 0,
      acconto3: nuovaBustaPaga.acconto3 ? Number(nuovaBustaPaga.acconto3) : 0,
      acconto4: nuovaBustaPaga.acconto4 ? Number(nuovaBustaPaga.acconto4) : 0,
      totaleAcconti: nuovaBustaPaga.totaleAcconti
        ? Number(nuovaBustaPaga.totaleAcconti)
        : 0,
      bonus: nuovaBustaPaga.bonus ? Number(nuovaBustaPaga.bonus) : 0,
      importoBonifico: nuovaBustaPaga.importoBonifico
        ? Number(nuovaBustaPaga.importoBonifico)
        : null,
      differenza: nuovaBustaPaga.differenza
        ? Number(nuovaBustaPaga.differenza)
        : null,
      dipendenti: {
        ...nuovaBustaPaga.dipendenti,
        retribuzione: Number(nuovaBustaPaga.dipendenti.retribuzione),
      },
    };

    return NextResponse.json(bustaPagaFormatted, { status: 201 });
  } catch (error) {
    console.error("Errore nella creazione busta paga:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Errore nella creazione della busta paga" },
      { status: 500 }
    );
  }
}
