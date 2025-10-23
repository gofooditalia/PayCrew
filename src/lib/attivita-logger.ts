import { prisma } from '@/lib/prisma'
import { AttivitaValidator } from '@/lib/validation/attivita-validator'
import { AttivitaMonitor } from '@/lib/attivita-monitor'

// Interfacce per tipi specifici
export interface DipendenteData {
  id: string
  nome: string
  cognome: string
}

export interface PresenzaData {
  id: string
  dipendenteId: string
  data: Date | string
}

export interface BustaPagaData {
  id: string
  dipendenteId: string
  mese: number
  anno: number
  netto: number
}

export interface FeriePermessiData {
  id: string
  dipendenteId: string
  tipo: string
  giorni: number
}

export interface LogAttivitaParams {
  tipoAttivita: string
  descrizione: string
  idEntita?: string
  tipoEntita?: string
  userId: string
  aziendaId: string
  datiAggiuntivi?: unknown
}

export class AttivitaLogger {
  /**
   * Metodo principale per il logging delle attività con validazione completa
   */
  static async logAttivita({
    tipoAttivita,
    descrizione,
    idEntita,
    tipoEntita,
    userId,
    aziendaId,
    datiAggiuntivi
  }: LogAttivitaParams): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validazione completa degli input
      const validatedParams = AttivitaValidator.validateLogParams({
        tipoAttivita,
        descrizione,
        idEntita,
        tipoEntita,
        userId,
        aziendaId,
        datiAggiuntivi: datiAggiuntivi as any
      });

      // Inserimento type-safe con query raw per compatibilità Vercel
      const result = await prisma.$queryRawUnsafe(`
        INSERT INTO attivita (
          id, "tipoAttivita", descrizione, "idEntita", "tipoEntita",
          "userId", "aziendaId", "datiAggiuntivi", "createdAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()
        )
        RETURNING id, "tipoAttivita", "createdAt"
      `,
        validatedParams.tipoAttivita,
        validatedParams.descrizione,
        validatedParams.idEntita,
        validatedParams.tipoEntita,
        validatedParams.userId,
        validatedParams.aziendaId,
        validatedParams.datiAggiuntivi as any
      ) as Array<{
        id: string
        tipoAttivita: string
        createdAt: Date
      }>;
      
      // Prendi il primo risultato (l'array ha un solo elemento)
      const activityResult = result[0];

      const duration = Date.now() - startTime;
      
      // Logging strutturato del successo
      console.log('✅ Attività registrata con successo', {
        attivitaId: activityResult.id,
        tipoAttivita: validatedParams.tipoAttivita,
        userId: validatedParams.userId.substring(0, 8) + '...',
        aziendaId: validatedParams.aziendaId.substring(0, 8) + '...',
        duration: `${duration}ms`
      });

      // Registra successo nel monitor
      AttivitaMonitor.recordSuccess(duration);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Logging strutturato dell'errore
      console.error('❌ Errore durante il logging dell\'attività', {
        tipoAttivita,
        descrizione: descrizione.substring(0, 100) + '...',
        userId: userId.substring(0, 8) + '...',
        aziendaId: aziendaId.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        duration: `${duration}ms`
      });

      // Registra errore nel monitor
      AttivitaMonitor.recordError();
      
      // Non bloccare l'operazione principale se il logging fallisce
    }
  }

  /**
   * Metodo di retry per logging critico
   */
  static async logAttivitaWithRetry(params: LogAttivitaParams, maxRetries = 3): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.logAttivita(params);
        return; // Successo
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          // Ultimo tentativo fallito, log a servizio esterno
          console.error('🚨 AttivitaLogger: tutti i retry falliti', {
            params: {
              ...params,
              userId: params.userId.substring(0, 8) + '...',
              aziendaId: params.aziendaId.substring(0, 8) + '...'
            },
            error: lastError.message
          });
          return;
        }
        
        // Attesa esponenziale con jitter
        const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  static async logCreazioneDipendente(dipendente: DipendenteData, userId: string, aziendaId: string): Promise<void> {
    await this.logAttivita({
      tipoAttivita: 'CREAZIONE_DIPENDENTE',
      descrizione: `Nuovo dipendente aggiunto: ${dipendente.nome} ${dipendente.cognome}`,
      idEntita: dipendente.id,
      tipoEntita: 'DIPENDENTE',
      userId,
      aziendaId,
      datiAggiuntivi: {
        dipendenteId: dipendente.id,
        nome: dipendente.nome,
        cognome: dipendente.cognome
      } as Record<string, unknown>
    })
  }

  static async logModificaDipendente(dipendente: DipendenteData, userId: string, aziendaId: string): Promise<void> {
    await this.logAttivita({
      tipoAttivita: 'MODIFICA_DIPENDENTE',
      descrizione: `Dipendente modificato: ${dipendente.nome} ${dipendente.cognome}`,
      idEntita: dipendente.id,
      tipoEntita: 'DIPENDENTE',
      userId,
      aziendaId,
      datiAggiuntivi: {
        dipendenteId: dipendente.id,
        nome: dipendente.nome,
        cognome: dipendente.cognome
      } as Record<string, unknown>
    })
  }

  static async logEliminazioneDipendente(dipendenteId: string, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
    await this.logAttivita({
      tipoAttivita: 'ELIMINAZIONE_DIPENDENTE',
      descrizione: `Dipendente eliminato: ${dipendenteNome}`,
      idEntita: dipendenteId,
      tipoEntita: 'DIPENDENTE',
      userId,
      aziendaId,
      datiAggiuntivi: {
        dipendenteId
      }
    })
  }

  static async logRegistrazionePresenza(presenza: PresenzaData, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
    await this.logAttivita({
      tipoAttivita: 'REGISTRAZIONE_PRESENZA',
      descrizione: `Presenza registrata per: ${dipendenteNome}`,
      idEntita: presenza.id,
      tipoEntita: 'PRESENZA',
      userId,
      aziendaId,
      datiAggiuntivi: {
        presenzaId: presenza.id,
        dipendenteId: presenza.dipendenteId,
        data: presenza.data
      } as Record<string, unknown>
    })
  }

  static async logModificaPresenza(presenza: PresenzaData, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
    await this.logAttivita({
      tipoAttivita: 'MODIFICA_PRESENZA',
      descrizione: `Presenza modificata per: ${dipendenteNome}`,
      idEntita: presenza.id,
      tipoEntita: 'PRESENZA',
      userId,
      aziendaId,
      datiAggiuntivi: {
        presenzaId: presenza.id,
        dipendenteId: presenza.dipendenteId,
        data: presenza.data
      } as Record<string, unknown>
    })
  }

  static async logGenerazioneBustaPaga(bustaPaga: BustaPagaData, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
    await this.logAttivita({
      tipoAttivita: 'GENERAZIONE_BUSTA_PAGA',
      descrizione: `Busta paga generata per: ${dipendenteNome} (${bustaPaga.mese}/${bustaPaga.anno})`,
      idEntita: bustaPaga.id,
      tipoEntita: 'BUSTA_PAGA',
      userId,
      aziendaId,
      datiAggiuntivi: {
        bustaPagaId: bustaPaga.id,
        dipendenteId: bustaPaga.dipendenteId,
        mese: bustaPaga.mese,
        anno: bustaPaga.anno,
        netto: bustaPaga.netto
      } as Record<string, unknown>
    })
  }

  static async logRichiestaFerie(feriePermessi: FeriePermessiData, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
    await this.logAttivita({
      tipoAttivita: 'RICHIESTA_FERIE',
      descrizione: `Richiesta ferie/permessi per: ${dipendenteNome}`,
      idEntita: feriePermessi.id,
      tipoEntita: 'FERIE_PERMESSI',
      userId,
      aziendaId,
      datiAggiuntivi: {
        feriePermessiId: feriePermessi.id,
        dipendenteId: feriePermessi.dipendenteId,
        tipo: feriePermessi.tipo,
        giorni: feriePermessi.giorni
      } as Record<string, unknown>
    })
  }

  static async logApprovazioneFerie(feriePermessi: FeriePermessiData, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
    await this.logAttivita({
      tipoAttivita: 'APPROVAZIONE_FERIE',
      descrizione: `Richiesta ferie approvata per: ${dipendenteNome}`,
      idEntita: feriePermessi.id,
      tipoEntita: 'FERIE_PERMESSI',
      userId,
      aziendaId,
      datiAggiuntivi: {
        feriePermessiId: feriePermessi.id,
        dipendenteId: feriePermessi.dipendenteId,
        tipo: feriePermessi.tipo,
        giorni: feriePermessi.giorni
      } as Record<string, unknown>
    })
  }

  static async logRifiutoFerie(feriePermessi: FeriePermessiData, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
    await this.logAttivita({
      tipoAttivita: 'RIFIUTO_FERIE',
      descrizione: `Richiesta ferie rifiutata per: ${dipendenteNome}`,
      idEntita: feriePermessi.id,
      tipoEntita: 'FERIE_PERMESSI',
      userId,
      aziendaId,
      datiAggiuntivi: {
        feriePermessiId: feriePermessi.id,
        dipendenteId: feriePermessi.dipendenteId,
        tipo: feriePermessi.tipo,
        giorni: feriePermessi.giorni
      } as Record<string, unknown>
    })
  }
}