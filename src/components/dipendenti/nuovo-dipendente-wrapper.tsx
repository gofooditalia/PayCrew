'use client'

import DipendenteForm from './dipendente-form'
import NuovoDipendenteHeader from './nuovo-dipendente-header'

interface Sede {
  id: string
  nome: string
}

interface Dipendente {
  id: string
  nome: string
  cognome: string
  codiceFiscale?: string
  dataNascita?: string
  luogoNascita?: string
  indirizzo?: string
  citta?: string
  cap?: string
  telefono?: string
  email?: string
  iban?: string
  dataAssunzione: string
  dataScadenzaContratto?: string | null
  tipoContratto: string
  ccnl: string
  note?: string
  qualifica?: string
  retribuzione?: number
  retribuzioneNetta?: number | null
  limiteContanti?: number | null
  limiteBonifico?: number | null
  coefficienteMaggiorazione?: number | null
  oreSettimanali: number
  sedeId?: string
  attivo: boolean
  dataCessazione?: string | null
}

interface NuovoDipendenteWrapperProps {
  sedi: Sede[]
  dipendente?: Dipendente
}

export default function NuovoDipendenteWrapper({ sedi, dipendente }: NuovoDipendenteWrapperProps) {
  return (
    <DipendenteForm
      sedi={sedi}
      dipendente={dipendente}
      renderHeaderControls={({ sedeId, attivo, onSedeChange, onAttivoChange }) => (
        <NuovoDipendenteHeader
          sedi={sedi}
          sedeId={sedeId}
          attivo={attivo}
          onSedeChange={onSedeChange}
          onAttivoChange={onAttivoChange}
        />
      )}
    />
  )
}
