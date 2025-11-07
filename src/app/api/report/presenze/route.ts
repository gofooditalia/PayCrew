import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type {
  ReportPresenzeMensile,
  RiepilogoPresenze,
} from "@/types/report";

/**
 * GET /api/report/presenze
 * Genera report mensile presenze con statistiche aggregate
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

    // Calcola primo e ultimo giorno del mese
    const primoGiorno = new Date(anno, mese - 1, 1);
    const ultimoGiorno = new Date(anno, mese, 0, 23, 59, 59);

    // Recupera tutti i dipendenti attivi dell'azienda (con filtro sede opzionale)
    const dipendenti = await prisma.dipendenti.findMany({
      where: {
        aziendaId: userRecord.aziendaId,
        attivo: true, // Solo dipendenti attivi
        ...(sedeId && { sedeId }),
      },
      include: {
        sedi: true,
        presenze: {
          where: {
            data: {
              gte: primoGiorno,
              lte: ultimoGiorno,
            },
          },
        },
      },
      orderBy: [{ cognome: "asc" }, { nome: "asc" }],
    });

    // Calcola giorni lavorativi del mese (esclusi sabato e domenica)
    let giorniLavorativi = 0;
    const dataTemp = new Date(primoGiorno);
    while (dataTemp <= ultimoGiorno) {
      const giorno = dataTemp.getDay();
      if (giorno !== 0 && giorno !== 6) {
        // 0 = domenica, 6 = sabato
        giorniLavorativi++;
      }
      dataTemp.setDate(dataTemp.getDate() + 1);
    }

    // Calcola statistiche per ogni dipendente
    const riepilogo: RiepilogoPresenze = {
      totaleDipendenti: dipendenti.length,
      totaleOreLavorate: 0,
      totaleOreStraordinario: 0,
      totaleGiorniLavorati: 0,
      totaleAssenze: 0,
      mediaOrePerDipendente: 0,
      mediaPercentualePresenza: 0,
    };

    const reportDipendenti = dipendenti.map((dip) => {
      const oreLavorate = dip.presenze.reduce(
        (sum, p) => sum + (p.oreLavorate ? Number(p.oreLavorate) : 0),
        0
      );
      const oreStraordinario = dip.presenze.reduce(
        (sum, p) => sum + (p.oreStraordinario ? Number(p.oreStraordinario) : 0),
        0
      );
      const giorniLavorati = dip.presenze.length;
      const assenze = giorniLavorativi - giorniLavorati;
      const oreContrattualizzate =
        Number(dip.oreSettimanali) * 4.33; /* media settimane/mese */
      const percentualePresenza =
        oreContrattualizzate > 0
          ? (oreLavorate / oreContrattualizzate) * 100
          : 0;

      // Aggiungi ai totali
      riepilogo.totaleOreLavorate += oreLavorate;
      riepilogo.totaleOreStraordinario += oreStraordinario;
      riepilogo.totaleGiorniLavorati += giorniLavorati;
      riepilogo.totaleAssenze += assenze;

      return {
        dipendenteId: dip.id,
        nome: dip.nome,
        cognome: dip.cognome,
        sede: dip.sedi
          ? {
              id: dip.sedi.id,
              nome: dip.sedi.nome,
            }
          : undefined,
        oreContrattualizzate,
        oreLavorate,
        oreStraordinario,
        giorniLavorati,
        assenze,
        percentualePresenza,
      };
    });

    // Calcola medie
    riepilogo.mediaOrePerDipendente =
      dipendenti.length > 0
        ? riepilogo.totaleOreLavorate / dipendenti.length
        : 0;
    riepilogo.mediaPercentualePresenza =
      reportDipendenti.length > 0
        ? reportDipendenti.reduce((sum, d) => sum + d.percentualePresenza, 0) /
          reportDipendenti.length
        : 0;

    const report: ReportPresenzeMensile = {
      mese,
      anno,
      dipendenti: reportDipendenti,
      riepilogo,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Errore nel generare report presenze:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Errore nella generazione del report" },
      { status: 500 }
    );
  }
}
