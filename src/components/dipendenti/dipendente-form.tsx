'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface Sede {
  id: string
  nome: string
}

interface DipendenteFormProps {
  sedi: Sede[]
  dipendente?: {
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
}

export default function DipendenteForm({ sedi, dipendente }: DipendenteFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nome: dipendente?.nome || '',
    cognome: dipendente?.cognome || '',
    codiceFiscale: dipendente?.codiceFiscale || '',
    dataNascita: dipendente?.dataNascita || '',
    luogoNascita: dipendente?.luogoNascita || '',
    indirizzo: dipendente?.indirizzo || '',
    citta: dipendente?.citta || '',
    cap: dipendente?.cap || '',
    telefono: dipendente?.telefono || '',
    email: dipendente?.email || '',
    iban: dipendente?.iban || '',
    dataAssunzione: dipendente?.dataAssunzione || '',
    dataScadenzaContratto: dipendente?.dataScadenzaContratto || '',
    tipoContratto: dipendente?.tipoContratto || 'TEMPO_INDETERMINATO',
    ccnl: dipendente?.ccnl || 'TURISMO',
    note: dipendente?.note || '',
    qualifica: dipendente?.qualifica || '',
    retribuzione: dipendente?.retribuzione?.toString() || '',
    retribuzioneNetta: dipendente?.retribuzioneNetta?.toString() || '',
    limiteContanti: dipendente?.limiteContanti?.toString() || '',
    limiteBonifico: dipendente?.limiteBonifico?.toString() || '',
    coefficienteMaggiorazione: dipendente?.coefficienteMaggiorazione?.toString() || '',
    oreSettimanali: dipendente?.oreSettimanali?.toString() || '40',
    sedeId: dipendente?.sedeId || '',
    attivo: dipendente?.attivo !== undefined ? dipendente.attivo : true,
    dataCessazione: dipendente?.dataCessazione || ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      }

      // Calcola automaticamente quando cambiano retribuzioneNetta, limiteBonifico o coefficiente
      if (name === 'retribuzioneNetta' || name === 'limiteBonifico' || name === 'coefficienteMaggiorazione') {
        const retribuzioneBase = parseFloat(updated.retribuzioneNetta) || 0
        const bonifico = parseFloat(updated.limiteBonifico) || 0
        const coefficiente = parseFloat(updated.coefficienteMaggiorazione) || 0

        // 1. Calcola bonus (coefficiente% sul bonifico)
        const bonus = bonifico * (coefficiente / 100)

        // 2. Calcola bonifico totale con maggiorazione
        const bonificoTotale = bonifico + bonus

        // 3. Calcola retribuzione totale (base + bonus)
        const retribuzioneTotale = retribuzioneBase + bonus

        // 4. Calcola cash (retribuzione totale - bonifico totale)
        const cash = retribuzioneTotale - bonificoTotale

        // Aggiorna limiteContanti con il cash calcolato
        updated.limiteContanti = cash > 0 ? cash.toFixed(2) : ''
      }

      return updated
    })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setFormData(prev => ({
      ...prev,
      attivo: checked,
      // Se il dipendente diventa attivo, rimuovi la data di cessazione
      dataCessazione: checked ? '' : prev.dataCessazione
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Utente non autenticato')
        setLoading(false)
        return
      }

      // Get the user's company
      const { data: userData } = await supabase
        .from('users')
        .select('aziendaId')
        .eq('id', user.id)
        .single()

      if (!userData?.aziendaId) {
        setError('Azienda non trovata')
        setLoading(false)
        return
      }

      // Prepare the data for API
      const preparedData = {
        id: dipendente?.id || crypto.randomUUID(),
        ...formData,
        retribuzione: formData.retribuzione ? parseFloat(formData.retribuzione) : null,
        retribuzioneNetta: formData.retribuzioneNetta ? parseFloat(formData.retribuzioneNetta) : null,
        limiteContanti: formData.limiteContanti ? parseFloat(formData.limiteContanti) : null,
        limiteBonifico: formData.limiteBonifico ? parseFloat(formData.limiteBonifico) : null,
        coefficienteMaggiorazione: formData.coefficienteMaggiorazione ? parseFloat(formData.coefficienteMaggiorazione) : 0,
        oreSettimanali: parseInt(formData.oreSettimanali),
        aziendaId: userData.aziendaId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (dipendente) {
        // Update existing dipendente using API route
        const response = await fetch(`/api/dipendenti/${dipendente.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Errore durante l\'aggiornamento del dipendente')
        } else {
          router.push('/dipendenti')
        }
      } else {
        // Create new dipendente using API route
        const response = await fetch('/api/dipendenti', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Errore durante la creazione del dipendente')
        } else {
          router.push('/dipendenti')
        }
      }
    } catch {
      setError('Si è verificato un errore durante il salvataggio')
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dati Anagrafici e Contatto - UNIFICATI */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informazioni Dipendente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campi obbligatori sempre visibili */}
            <div>
              <Label htmlFor="nome" className="mb-1">
                Nome *
              </Label>
              <Input
                type="text"
                id="nome"
                name="nome"
                required
                value={formData.nome}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="cognome" className="mb-1">
                Cognome *
              </Label>
              <Input
                type="text"
                id="cognome"
                name="cognome"
                required
                value={formData.cognome}
                onChange={handleChange}
              />
            </div>

            {/* Campi opzionali in accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="dati-extra" className="border-none">
                <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-2">
                  Dati anagrafici e contatto (opzionali)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="codiceFiscale" className="mb-1">
                      Codice Fiscale
                    </Label>
                    <Input
                      type="text"
                      id="codiceFiscale"
                      name="codiceFiscale"
                      value={formData.codiceFiscale}
                      onChange={handleChange}
                      className="uppercase"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataNascita" className="mb-1">
                      Data di Nascita
                    </Label>
                    <Input
                      type="date"
                      id="dataNascita"
                      name="dataNascita"
                      value={formData.dataNascita}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="luogoNascita" className="mb-1">
                      Luogo di Nascita
                    </Label>
                    <Input
                      type="text"
                      id="luogoNascita"
                      name="luogoNascita"
                      value={formData.luogoNascita}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="pt-2 border-t">
                    <Label htmlFor="indirizzo" className="mb-1">
                      Indirizzo
                    </Label>
                    <Input
                      type="text"
                      id="indirizzo"
                      name="indirizzo"
                      value={formData.indirizzo}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="citta" className="mb-1">
                      Città
                    </Label>
                    <Input
                      type="text"
                      id="citta"
                      name="citta"
                      value={formData.citta}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cap" className="mb-1">
                      CAP
                    </Label>
                    <Input
                      type="text"
                      id="cap"
                      name="cap"
                      value={formData.cap}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefono" className="mb-1">
                      Telefono
                    </Label>
                    <Input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="mb-1">
                      Email
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="iban" className="mb-1">
                      IBAN
                    </Label>
                    <Input
                      type="text"
                      id="iban"
                      name="iban"
                      value={formData.iban}
                      onChange={handleChange}
                      className="uppercase"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Dati Contrattuali */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informazioni Contrattuali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campi principali sempre visibili */}
            <div>
              <Label htmlFor="dataAssunzione" className="mb-1">
                Data Assunzione *
              </Label>
              <Input
                type="date"
                id="dataAssunzione"
                name="dataAssunzione"
                required
                value={formData.dataAssunzione}
                onChange={handleChange}
              />
            </div>

            {(formData.tipoContratto === 'TEMPO_DETERMINATO' || formData.tipoContratto === 'STAGIONALE') && (
              <div>
                <Label htmlFor="dataScadenzaContratto" className="mb-1">
                  Scadenza Contratto *
                </Label>
                <Input
                  type="date"
                  id="dataScadenzaContratto"
                  name="dataScadenzaContratto"
                  required
                  value={formData.dataScadenzaContratto}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* Campi secondari in accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="dati-contrattuali-extra" className="border-none">
                <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-2">
                  Dettagli contrattuali aggiuntivi
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="tipoContratto" className="mb-1">
                      Tipo Contratto
                    </Label>
                    <select
                      id="tipoContratto"
                      name="tipoContratto"
                      value={formData.tipoContratto}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="TEMPO_INDETERMINATO">Tempo Indeterminato</option>
                      <option value="TEMPO_DETERMINATO">Tempo Determinato</option>
                      <option value="APPRENDISTATO">Apprendistato</option>
                      <option value="STAGIONALE">Stagionale</option>
                      <option value="PARTTIME">Part-time</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="ccnl" className="mb-1">
                      CCNL
                    </Label>
                    <select
                      id="ccnl"
                      name="ccnl"
                      value={formData.ccnl}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="TURISMO">Turismo</option>
                      <option value="COMMERCIO">Commercio</option>
                      <option value="METALMECCANICI">Metalmeccanici</option>
                      <option value="ALTRO">Altro</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="qualifica" className="mb-1">
                      Qualifica
                    </Label>
                    <Input
                      type="text"
                      id="qualifica"
                      name="qualifica"
                      placeholder="es. Cameriere, Cuoco, Receptionist..."
                      value={formData.qualifica}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="retribuzione" className="mb-1">
                      Retribuzione Lorda Mensile (€)
                    </Label>
                    <Input
                      type="number"
                      id="retribuzione"
                      name="retribuzione"
                      step="0.01"
                      min="0"
                      value={formData.retribuzione}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Retribuzione lorda mensile (opzionale, per riferimento)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="note" className="mb-1">
                      Note
                    </Label>
                    <Input
                      type="text"
                      id="note"
                      name="note"
                      placeholder="Note aggiuntive sul contratto..."
                      value={formData.note}
                      onChange={handleChange}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Configurazione Limiti Pagamento - SEZIONE EVIDENZIATA */}
        <Card className="border-2 border-primary/50 bg-primary/5 shadow-lg">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-primary">💰</span>
              Configurazione Limiti Contrattuali
              <span className="text-xs font-normal text-muted-foreground ml-2">(Sezione Importante)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="retribuzioneNetta" className="mb-1">
                  Retribuzione Netta Mensile (€) *
                </Label>
                <Input
                  type="number"
                  id="retribuzioneNetta"
                  name="retribuzioneNetta"
                  step="0.01"
                  min="0"
                  value={formData.retribuzioneNetta}
                  onChange={handleChange}
                  placeholder="es. 1250.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Retribuzione mensile al netto (senza bonus)
                </p>
              </div>

              <div>
                <Label htmlFor="limiteBonifico" className="mb-1">
                  Limite Bonifico (€)
                </Label>
                <Input
                  type="number"
                  id="limiteBonifico"
                  name="limiteBonifico"
                  step="0.01"
                  min="0"
                  value={formData.limiteBonifico}
                  onChange={handleChange}
                  placeholder="es. 750.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quota bonifico (prima della maggiorazione)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="coefficienteMaggiorazione" className="mb-1">
                Coefficiente Maggiorazione Bonifico (%)
              </Label>
              <Input
                type="number"
                id="coefficienteMaggiorazione"
                name="coefficienteMaggiorazione"
                step="0.01"
                min="0"
                max="100"
                value={formData.coefficienteMaggiorazione}
                onChange={handleChange}
                placeholder="es. 4.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentuale di maggiorazione applicata alla quota bonifico
              </p>
            </div>

            {/* Riepilogo calcolo */}
            {(formData.retribuzioneNetta || formData.limiteBonifico) && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Riepilogo Calcolo:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground font-semibold">Retribuzione Netta Totale:</span>
                  <span className="font-bold text-right text-lg">
                    {(() => {
                      const base = parseFloat(formData.retribuzioneNetta || '0')
                      const bonifico = parseFloat(formData.limiteBonifico || '0')
                      const coefficiente = parseFloat(formData.coefficienteMaggiorazione || '0')
                      const bonus = bonifico * (coefficiente / 100)
                      return (base + bonus).toFixed(2)
                    })()} €
                  </span>

                  <span className="text-muted-foreground">Bonifico base:</span>
                  <span className="font-medium text-right">
                    {parseFloat(formData.limiteBonifico || '0').toFixed(2)} €
                  </span>

                  <span className="text-muted-foreground">Maggiorazione ({formData.coefficienteMaggiorazione || 0}%):</span>
                  <span className="font-medium text-right">
                    {(parseFloat(formData.limiteBonifico || '0') * parseFloat(formData.coefficienteMaggiorazione || '0') / 100).toFixed(2)} €
                  </span>

                  <span className="text-muted-foreground">Bonifico totale:</span>
                  <span className="font-medium text-right">
                    {(parseFloat(formData.limiteBonifico || '0') + (parseFloat(formData.limiteBonifico || '0') * parseFloat(formData.coefficienteMaggiorazione || '0') / 100)).toFixed(2)} €
                  </span>

                  <div className="col-span-2 h-px bg-border my-2"></div>

                  <span className="text-lg font-bold text-foreground">CONTANTI:</span>
                  <span className="font-bold text-right text-2xl text-primary">
                    {parseFloat(formData.limiteContanti || '0').toFixed(2)} €
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dettagli Contrattuali - Continuazione */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Orario e Sede</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="oreSettimanali" className="mb-1">
                Ore Settimanali *
              </Label>
              <Input
                type="number"
                id="oreSettimanali"
                name="oreSettimanali"
                required
                min="1"
                max="48"
                value={formData.oreSettimanali}
                onChange={handleChange}
              />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="sede-cessazione" className="border-none">
                <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-2">
                  Sede e stato dipendente
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="sedeId" className="mb-1">
                      Sede di Lavoro
                    </Label>
                    <select
                      id="sedeId"
                      name="sedeId"
                      value={formData.sedeId}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Seleziona una sede</option>
                      {sedi.map((sede) => (
                        <option key={sede.id} value={sede.id}>
                          {sede.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="attivo"
                      checked={formData.attivo}
                      onChange={handleCheckboxChange}
                    />
                    <Label
                      htmlFor="attivo"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Dipendente attivo
                    </Label>
                  </div>

                  {!formData.attivo && (
                    <div>
                      <Label htmlFor="dataCessazione" className="mb-1">
                        Data Cessazione {!formData.attivo && '*'}
                      </Label>
                      <Input
                        type="date"
                        id="dataCessazione"
                        name="dataCessazione"
                        required={!formData.attivo}
                        value={formData.dataCessazione}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dipendenti')}
        >
          Annulla
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? 'Salvataggio...' : dipendente ? 'Aggiorna' : 'Salva'}
        </Button>
      </div>
    </form>
  )
}