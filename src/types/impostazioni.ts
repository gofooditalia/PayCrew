import { tipo_turno } from '@prisma/client'

export interface OrarioLavoro {
  id: string
  nome: string
  oraInizio: string
  oraFine: string
  pausaPranzoInizio: string | null
  pausaPranzoFine: string | null
  oreTotali: number
  aziendaId: string
  attivo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FasciaOraria {
  id: string
  nome: string
  tipoTurno: tipo_turno
  oraInizio: string
  oraFine: string
  pausaPranzoInizio: string | null
  pausaPranzoFine: string | null
  maggiorazione: number
  aziendaId: string
  attivo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Festivita {
  id: string
  nome: string
  data: Date
  ricorrente: boolean
  maggiorazione: number
  aziendaId: string
  createdAt: Date
  updatedAt: Date
}
