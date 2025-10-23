import { TipoAttivita, TipoEntita } from '@prisma/client';

export class AttivitaValidator {
  /**
   * Valida che il tipoAttivita sia un valore valido dell'enum
   */
  static validateTipoAttivita(value: string): TipoAttivita {
    if (!Object.values(TipoAttivita).includes(value as TipoAttivita)) {
      throw new Error(`tipoAttivita non valido: ${value}. Valori ammessi: ${Object.values(TipoAttivita).join(', ')}`);
    }
    return value as TipoAttivita;
  }

  /**
   * Valida che il tipoEntita sia un valore valido dell'enum
   */
  static validateTipoEntita(value: string | null | undefined): TipoEntita | null {
    if (!value) return null;
    if (!Object.values(TipoEntita).includes(value as TipoEntita)) {
      throw new Error(`tipoEntita non valido: ${value}. Valori ammessi: ${Object.values(TipoEntita).join(', ')}`);
    }
    return value as TipoEntita;
  }

  /**
   * Sanitizza la descrizione rimuovendo caratteri pericolosi e limitando la lunghezza
   */
  static sanitizeDescription(description: string): string {
    if (typeof description !== 'string') {
      throw new Error('La descrizione deve essere una stringa');
    }
    
    // Rimuovi caratteri di controllo e limita la lunghezza
    return description
      .substring(0, 1000)
      .replace(/[\x00-\x1F\x7F]/g, '') // Rimuove caratteri di controllo
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Rimuove script
      .trim();
  }

  /**
   * Valida che un UUID sia in formato corretto
   */
  static validateUUID(uuid: string, fieldName: string): string {
    if (typeof uuid !== 'string') {
      throw new Error(`${fieldName} deve essere una stringa`);
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      throw new Error(`${fieldName} non è un UUID valido: ${uuid}`);
    }
    
    return uuid;
  }

  /**
   * Valida e sanitizza i dati aggiuntivi JSON
   */
  static validateDatiAggiuntivi(dati: any): any {
    if (dati === null || dati === undefined) {
      return null;
    }
    
    try {
      // Converti in JSON e ritorna per validare che sia serializzabile
      const jsonString = JSON.stringify(dati);
      
      // Limita la dimensione dei dati aggiuntivi
      if (jsonString.length > 10000) {
        throw new Error('I dati aggiuntivi sono troppo grandi (max 10KB)');
      }
      
      return dati;
    } catch (error) {
      throw new Error(`Dati aggiuntivi non validi: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  }

  /**
   * Valida tutti i parametri per il logging attività
   */
  static validateLogParams(params: {
    tipoAttivita: string;
    descrizione: string;
    idEntita?: string;
    tipoEntita?: string;
    userId: string;
    aziendaId: string;
    datiAggiuntivi?: any;
  }) {
    const {
      tipoAttivita,
      descrizione,
      idEntita,
      tipoEntita,
      userId,
      aziendaId,
      datiAggiuntivi
    } = params;

    return {
      tipoAttivita: this.validateTipoAttivita(tipoAttivita),
      descrizione: this.sanitizeDescription(descrizione),
      idEntita: idEntita ? this.validateUUID(idEntita, 'idEntita') : null,
      tipoEntita: this.validateTipoEntita(tipoEntita),
      userId: this.validateUUID(userId, 'userId'),
      aziendaId: this.validateUUID(aziendaId, 'aziendaId'),
      datiAggiuntivi: this.validateDatiAggiuntivi(datiAggiuntivi)
    };
  }
}