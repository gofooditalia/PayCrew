import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils/currency'
import {
  User,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

interface CedolinoDettaglioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  busta: any | null
}

/**
 * Dialog per visualizzare i dettagli completi di un cedolino
 * Mostra tutte le informazioni in modo organizzato e leggibile
 */
export function CedolinoDettaglioDialog({
  open,
  onOpenChange,
  busta,
}: CedolinoDettaglioDialogProps) {
  if (!busta) return null

  const mesi = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ]

  const differenzaPositiva = (busta.differenza || 0) >= 0
  const hasBonus = busta.bonus > 0
  const hasStraordinari = busta.straordinari > 0
  const hasAcconti = busta.totaleAcconti > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Dettaglio Cedolino</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informazioni Dipendente */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Dipendente
                  </div>
                  <div className="font-semibold">
                    {busta.dipendenti.nome} {busta.dipendenti.cognome}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Sede
                  </div>
                  <div className="font-semibold">
                    {busta.dipendenti.sedi?.nome || (
                      <span className="text-gray-400">Non assegnata</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Periodo
                  </div>
                  <div className="font-semibold">
                    {mesi[busta.mese - 1]} {busta.anno}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Ore Lavorate
                  </div>
                  <div className="font-semibold">{busta.oreLavorate}h</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sezione Retribuzione */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Retribuzione
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Retribuzione Lorda
                </span>
                <span className="font-semibold">
                  {formatCurrency(busta.retribuzioneLorda)}
                </span>
              </div>

              {hasBonus && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Bonus
                  </span>
                  <Badge variant="default" className="bg-green-600">
                    +{formatCurrency(busta.bonus)}
                  </Badge>
                </div>
              )}

              {hasStraordinari && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Straordinari
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    +{formatCurrency(busta.straordinari)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Sezione Ritenute */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ritenute
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Contributi INPS
                </span>
                <span className="text-red-600 dark:text-red-400">
                  -{formatCurrency(busta.contributiINPS)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">IRPEF</span>
                <span className="text-red-600 dark:text-red-400">
                  -{formatCurrency(busta.irpef)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Totale Ritenute</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -{formatCurrency(busta.totaleRitenute)}
                </span>
              </div>
            </div>
          </div>

          {hasAcconti && (
            <>
              <Separator />

              {/* Sezione Acconti */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Acconti Erogati
                </h3>
                <div className="space-y-3">
                  {busta.acconto1 > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        Acconto 1
                        {busta.dataAcconto1 && (
                          <span className="text-xs ml-2">
                            ({new Date(busta.dataAcconto1).toLocaleDateString()})
                          </span>
                        )}
                      </span>
                      <span className="text-orange-600 dark:text-orange-400">
                        -{formatCurrency(busta.acconto1)}
                      </span>
                    </div>
                  )}

                  {busta.acconto2 > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        Acconto 2
                        {busta.dataAcconto2 && (
                          <span className="text-xs ml-2">
                            ({new Date(busta.dataAcconto2).toLocaleDateString()})
                          </span>
                        )}
                      </span>
                      <span className="text-orange-600 dark:text-orange-400">
                        -{formatCurrency(busta.acconto2)}
                      </span>
                    </div>
                  )}

                  {busta.acconto3 > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        Acconto 3
                        {busta.dataAcconto3 && (
                          <span className="text-xs ml-2">
                            ({new Date(busta.dataAcconto3).toLocaleDateString()})
                          </span>
                        )}
                      </span>
                      <span className="text-orange-600 dark:text-orange-400">
                        -{formatCurrency(busta.acconto3)}
                      </span>
                    </div>
                  )}

                  {busta.acconto4 > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        Acconto 4
                        {busta.dataAcconto4 && (
                          <span className="text-xs ml-2">
                            ({new Date(busta.dataAcconto4).toLocaleDateString()})
                          </span>
                        )}
                      </span>
                      <span className="text-orange-600 dark:text-orange-400">
                        -{formatCurrency(busta.acconto4)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Totale Acconti</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      -{formatCurrency(busta.totaleAcconti)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Riepilogo Finale */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Riepilogo
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Netto Mensile</span>
                <span className="font-bold text-xl">
                  {formatCurrency(busta.netto)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {differenzaPositiva
                    ? 'Da Accreditare'
                    : 'Accredito in eccesso'}
                </span>
                <span
                  className={`font-bold text-xl ${
                    differenzaPositiva
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {differenzaPositiva ? '+' : ''}
                  {formatCurrency(busta.differenza || 0)}
                </span>
              </div>

              {busta.importoBonifico !== undefined && (
                <div className="flex justify-between items-center pt-3 border-t border-blue-200 dark:border-blue-800">
                  <span className="font-semibold text-lg">
                    Importo Bonifico
                  </span>
                  <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                    {formatCurrency(busta.importoBonifico)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Note (se presenti) */}
          {busta.note && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Note
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded p-3">
                  {busta.note}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
