/**
 * PresenzeFromTurniService
 *
 * Service per generare automaticamente presenze dai turni pianificati
 */

import { prisma } from '@/lib/prisma'
import { calcolaOreTraOrari } from '@/lib/utils/ore-calculator'
import { createRomeDateTime, extractRomeDate } from '@/lib/utils/timezone'
import type { Prisma } from '@prisma/client'

export interface GenerazioneOptions {
  dataInizio: Date
  dataFine: Date
  dipendenteId?: string
  sedeId?: string
  sovrascriviEsistenti?: boolean
  userId: string
  aziendaId: string
}

export interface GenerazioneResult {
  generated: number
  skipped: number
  updated: number
  errors: string[]
}

export class PresenzeFromTurniService {

  /**
   * Genera presenze da tutti i turni in un range di date
   */
  static async generaPresenzeRange(
    options: GenerazioneOptions
  ): Promise<GenerazioneResult> {
    const result: GenerazioneResult = {
      generated: 0,
      skipped: 0,
      updated: 0,
      errors: []
    }

    try {
      // Costruisci query turni
      const where: Prisma.turniWhereInput = {
        data: {
          gte: options.dataInizio,
          lte: options.dataFine
        },
        dipendenti: {
          aziendaId: options.aziendaId
        }
      }

      if (options.dipendenteId) {
        where.dipendenteId = options.dipendenteId
      }

      if (options.sedeId) {
        where.sedeId = options.sedeId
      }

      // Recupera turni nel range
      const turni = await prisma.turni.findMany({
        where,
        include: {
          dipendenti: {
            select: {
              id: true,
              nome: true,
              cognome: true,
              oreSettimanali: true
            }
          }
        },
        orderBy: {
          data: 'asc'
        }
      })

      // Genera presenza per ogni turno
      for (const turno of turni) {
        try {
          const generata = await this.generaPresenzaDaTurno(
            turno,
            options.sovrascriviEsistenti || false
          )

          if (generata === 'generated') {
            result.generated++
          } else if (generata === 'updated') {
            result.updated++
          } else if (generata === 'skipped') {
            result.skipped++
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto'
          result.errors.push(
            `Turno ${turno.id} (${turno.dipendenti.nome} ${turno.dipendenti.cognome} - ${turno.data.toLocaleDateString()}): ${errorMsg}`
          )
        }
      }

      return result
    } catch (error) {
      console.error('Errore generazione presenze:', error)
      throw new Error('Errore durante la generazione delle presenze')
    }
  }

  /**
   * Genera una singola presenza da un turno
   *
   * @returns 'generated' | 'updated' | 'skipped'
   */
  static async generaPresenzaDaTurno(
    turno: any,
    sovrascriviEsistente: boolean = false
  ): Promise<'generated' | 'updated' | 'skipped'> {

    // Verifica se esiste già una presenza per questo SPECIFICO turno
    // Questo permette di avere multiple presenze per lo stesso dipendente nello stesso giorno
    const presenzaEsistente = await prisma.presenze.findFirst({
      where: {
        dipendenteId: turno.dipendenteId,
        data: turno.data,
        turnoId: turno.id  // Aggiunto: cerca la presenza collegata a QUESTO turno specifico
      }
    })

    // Se esiste e non vogliamo sovrascrivere, skip
    if (presenzaEsistente && !sovrascriviEsistente) {
      return 'skipped'
    }

    // Calcola ore lavorate basandosi sugli orari del turno
    const { oreLavorate, oreStraordinario } = this.calcolaOreDaTurno(
      turno.oraInizio,
      turno.oraFine,
      turno.pausaPranzoInizio,
      turno.pausaPranzoFine,
      turno.dipendenti.oreSettimanali
    )

    // Crea DateTime completi per entrata e uscita in timezone Europe/Rome
    const dataString = extractRomeDate(turno.data)
    const entrata = createRomeDateTime(dataString, turno.oraInizio)
    const uscita = createRomeDateTime(dataString, turno.oraFine)

    // Dati presenza
    const presenzaData: Prisma.presenzeCreateInput = {
      data: turno.data,
      entrata,
      uscita,
      oreLavorate,
      oreStraordinario,
      stato: 'CONFERMATA', // Le presenze generate da turno sono automaticamente confermate
      generataDaTurno: true,
      dipendenti: {
        connect: { id: turno.dipendenteId }
      },
      turni: {
        connect: { id: turno.id }
      }
    }

    if (presenzaEsistente) {
      // Aggiorna presenza esistente solo se non è stata già modificata manualmente
      const nuovoStato = presenzaEsistente.stato === 'MODIFICATA' ? 'MODIFICATA' : 'CONFERMATA'
      await prisma.presenze.update({
        where: { id: presenzaEsistente.id },
        data: {
          entrata,
          uscita,
          oreLavorate,
          oreStraordinario,
          stato: nuovoStato,
          generataDaTurno: true,
          turnoId: turno.id
        }
      })
      return 'updated'
    } else {
      // Crea nuova presenza
      await prisma.presenze.create({
        data: presenzaData
      })
      return 'generated'
    }
  }

  /**
   * Calcola ore lavorate e straordinari da orari turno
   */
  private static calcolaOreDaTurno(
    oraInizio: string,
    oraFine: string,
    pausaPranzoInizio: string | null,
    pausaPranzoFine: string | null,
    oreSettimanali: number
  ): { oreLavorate: number; oreStraordinario: number } {

    // Calcola ore giornaliere standard (assumendo 5 giorni lavorativi)
    const oreGiornaliere = Math.round((oreSettimanali / 5) * 100) / 100

    // Calcola ore totali tra inizio e fine
    const oreTotali = calcolaOreTraOrari(oraInizio, oraFine)

    // Calcola pausa pranzo: usa quella del turno se presente, altrimenti fallback hardcoded
    let pausaPranzoOre = 0
    if (pausaPranzoInizio && pausaPranzoFine) {
      // Usa pausa pranzo dal turno
      pausaPranzoOre = calcolaOreTraOrari(pausaPranzoInizio, pausaPranzoFine)
    } else if (oreTotali >= 6) {
      // Fallback: pausa automatica di 30 minuti se lavora più di 6 ore
      pausaPranzoOre = 0.5
    }

    const oreLavorateNette = Math.max(0, oreTotali - pausaPranzoOre)

    // Calcola straordinari
    // oreLavorate contiene TUTTE le ore lavorate (normali + straordinari)
    // oreStraordinario contiene solo le ore oltre il limite giornaliero
    const oreGiornaliereStandard = oreGiornaliere || 8
    const oreStraordinario = Math.max(0, oreLavorateNette - oreGiornaliereStandard)

    return {
      oreLavorate: oreLavorateNette, // Tutte le ore lavorate (8h normali + 1h straordinario = 9h)
      oreStraordinario // Solo le ore straordinarie (1h)
    }
  }

  /**
   * Conferma una presenza generata da turno
   */
  static async confermaPresenza(
    presenzaId: string,
    modifiche?: {
      entrata?: string
      uscita?: string
      nota?: string
    }
  ) {
    const presenza = await prisma.presenze.findUnique({
      where: { id: presenzaId },
      include: {
        dipendenti: true
      }
    })

    if (!presenza) {
      throw new Error('Presenza non trovata')
    }

    // Se ci sono modifiche agli orari, ricalcola ore
    let updateData: Prisma.presenzeUpdateInput = {
      stato: 'CONFERMATA'
    }

    if (modifiche?.entrata || modifiche?.uscita) {
      const dataString = extractRomeDate(presenza.data)
      const nuovaEntrata = modifiche.entrata
        ? createRomeDateTime(dataString, modifiche.entrata)
        : presenza.entrata
      const nuovaUscita = modifiche.uscita
        ? createRomeDateTime(dataString, modifiche.uscita)
        : presenza.uscita

      if (nuovaEntrata && nuovaUscita) {
        // Ricalcola ore
        const oreTotali = calcolaOreTraOrari(
          modifiche.entrata || presenza.entrata?.toISOString().split('T')[1].substring(0, 5) || '00:00',
          modifiche.uscita || presenza.uscita?.toISOString().split('T')[1].substring(0, 5) || '00:00'
        )

        const oreGiornaliere = Math.round((presenza.dipendenti.oreSettimanali / 5) * 100) / 100
        const pausaPranzoOre = oreTotali >= 6 ? 0.5 : 0
        const oreLavorateNette = Math.max(0, oreTotali - pausaPranzoOre)
        const oreGiornaliereStandard = oreGiornaliere || 8

        updateData = {
          ...updateData,
          stato: 'MODIFICATA', // Se modifica orari, stato diventa MODIFICATA
          entrata: nuovaEntrata,
          uscita: nuovaUscita,
          oreLavorate: oreLavorateNette, // Tutte le ore lavorate
          oreStraordinario: Math.max(0, oreLavorateNette - oreGiornaliereStandard)
        }
      }
    }

    if (modifiche?.nota) {
      updateData.nota = modifiche.nota
    }

    return await prisma.presenze.update({
      where: { id: presenzaId },
      data: updateData
    })
  }

  /**
   * Marca una presenza come assente
   */
  static async marcaAssente(
    presenzaId: string,
    nota?: string
  ) {
    return await prisma.presenze.update({
      where: { id: presenzaId },
      data: {
        stato: 'ASSENTE',
        oreLavorate: 0,
        oreStraordinario: 0,
        nota: nota || 'Dipendente assente'
      }
    })
  }
}
