import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { ReportCedoliniMensile, TotaliReport } from "@/types/report";

/**
 * GET /api/report/cedolini
 * Genera report mensile cedolini con statistiche aggregate
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const mese = searchParams.get("mese")
      ? parseInt(searchParams.get("mese")!)
      : new Date().getMonth() + 1;
    const anno = searchParams.get("anno")
      ? parseInt(searchParams.get("anno")!)
      : new Date().getFullYear();
    const sedeId = searchParams.get("sedeId") || undefined;

    // Build where clause
    const where: Prisma.buste_pagaWhereInput = {
      dipendenti: {
        aziendaId: userRecord.aziendaId,
        ...(sedeId && { sedeId }),
      },
      mese,
      anno,
    };

    // Recupera tutte le buste paga del mese
    const bustePaga = await prisma.buste_paga.findMany({
      where,
      include: {
        dipendenti: {
          include: {
            sedi: true,
          },
        },
      },
      orderBy: [
        { dipendenti: { cognome: "asc" } },
        { dipendenti: { nome: "asc" } },
      ],
    });

    // Calcola i totali
    const totali: TotaliReport = {
      totaleDipendenti: bustePaga.length,
      totaleRetribuzioneLorda: 0,
      totaleStraordinari: 0,
      totaleBonus: 0,
      totaleLordo: 0,
      totaleContributiINPS: 0,
      totaleIrpef: 0,
      totaleRitenute: 0,
      totaleNetto: 0,
      totaleAcconti: 0,
      totaleImportoBonifico: 0,
      totaleDifferenza: 0,
      totaleOreLavorate: 0,
      totaleOreStraordinario: 0,
    };

    const dipendenti = bustePaga.map((bp) => {
      const retribuzioneLorda = Number(bp.retribuzioneLorda);
      const straordinari = Number(bp.straordinari);
      const bonus = bp.bonus ? Number(bp.bonus) : 0;
      const totaleLordo = Number(bp.totaleLordo);
      const contributiINPS = Number(bp.contributiINPS);
      const irpef = Number(bp.irpef);
      const totaleRitenute = Number(bp.totaleRitenute);
      const netto = Number(bp.netto);
      const acconto1 = bp.acconto1 ? Number(bp.acconto1) : 0;
      const acconto2 = bp.acconto2 ? Number(bp.acconto2) : 0;
      const acconto3 = bp.acconto3 ? Number(bp.acconto3) : 0;
      const acconto4 = bp.acconto4 ? Number(bp.acconto4) : 0;
      const totaleAcconti = bp.totaleAcconti ? Number(bp.totaleAcconti) : 0;
      const importoBonifico = bp.importoBonifico
        ? Number(bp.importoBonifico)
        : 0;
      const differenza = bp.differenza ? Number(bp.differenza) : 0;
      const oreLavorate = Number(bp.oreLavorate);
      const oreStraordinario = Number(bp.oreStraordinario);

      // Aggiungi ai totali
      totali.totaleRetribuzioneLorda += retribuzioneLorda;
      totali.totaleStraordinari += straordinari;
      totali.totaleBonus += bonus;
      totali.totaleLordo += totaleLordo;
      totali.totaleContributiINPS += contributiINPS;
      totali.totaleIrpef += irpef;
      totali.totaleRitenute += totaleRitenute;
      totali.totaleNetto += netto;
      totali.totaleAcconti += totaleAcconti;
      totali.totaleImportoBonifico += importoBonifico;
      totali.totaleDifferenza += differenza;
      totali.totaleOreLavorate += oreLavorate;
      totali.totaleOreStraordinario += oreStraordinario;

      return {
        dipendenteId: bp.dipendenti.id,
        nome: bp.dipendenti.nome,
        cognome: bp.dipendenti.cognome,
        sede: bp.dipendenti.sedi
          ? {
              id: bp.dipendenti.sedi.id,
              nome: bp.dipendenti.sedi.nome,
            }
          : undefined,
        retribuzioneLorda,
        straordinari,
        bonus,
        totaleLordo,
        contributiINPS,
        irpef,
        totaleRitenute,
        netto,
        acconto1,
        acconto2,
        acconto3,
        acconto4,
        totaleAcconti,
        importoBonifico,
        differenza,
        oreLavorate,
        oreStraordinario,
      };
    });

    const report: ReportCedoliniMensile = {
      mese,
      anno,
      dipendenti,
      totali,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Errore nel generare report cedolini:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Errore nella generazione del report" },
      { status: 500 }
    );
  }
}
