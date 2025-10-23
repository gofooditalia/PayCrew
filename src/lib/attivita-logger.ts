import { prisma } from '@/lib/prisma'
import { AttivitaValidator } from '@/lib/validation/attivita-validator'
import { AttivitaMonitor } from '@/lib/attivita-monitor'
import { TipoAttivita, TipoEntita } from '@prisma/client'

export interface LogAttivitaParams {
  tipoAttivita: string
  descrizione: string
  idEntita?: string
  tipoEntita?: string
  userId: string
  aziendaId: string
  datiAggiuntivi?: any
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
        datiAggiuntivi
      });

      // Inserimento type-safe con Prisma
      const result = await prisma.attivita.create({
        data: {
          tipoAttivita: validatedParams.tipoAttivita,
          descrizione: validatedParams.descrizione,
          idEntita: validatedParams.idEntita,
          tipoEntita: validatedParams.tipoEntita,
          userId: validatedParams.userId,
          aziendaId: validatedParams.aziendaId,
          datiAggiuntivi: validatedParams.datiAggiuntivi
        },
        select: {
          id: true,
          tipoAttivita: true,
          createdAt: true
        }
      });

      const duration = Date.now() - startTime;
      
      // Logging strutturato del successo
      console.log('✅ Attività registrata con successo', {
        attivitaId: result.id,
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

  static async logCreazioneDipendente(dipendente: any, userId: string, aziendaId: string): Promise<void> {
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
      }
    })
  }

  static async logModificaDipendente(dipendente: any, userId: string, aziendaId: string): Promise<void> {
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
      }
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

  static async logRegistrazionePresenza(presenza: any, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
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
      }
    })
  }

  static async logModificaPresenza(presenza: any, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
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
      }
    })
  }

  static async logGenerazioneBustaPaga(bustaPaga: any, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
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
      }
    })
  }

  static async logRichiestaFerie(feriePermessi: any, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
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
      }
    })
  }

  static async logApprovazioneFerie(feriePermessi: any, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
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
      }
    })
  }

  static async logRifiutoFerie(feriePermessi: any, dipendenteNome: string, userId: string, aziendaId: string): Promise<void> {
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
      }
    })
  }
}