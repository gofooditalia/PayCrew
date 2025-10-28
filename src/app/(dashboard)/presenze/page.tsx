import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PresenzePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Presenze</h1>
        <p className="text-gray-600 mb-4">Gestione presenze e assenze dei dipendenti</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registro Presenze</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Registra e visualizza le presenze giornaliere dei dipendenti.
            </p>
            <div className="mt-4">
              <Badge variant="secondary">In sviluppo</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Richieste Assenze</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Gestione delle richieste di ferie, permessi e congedi.
            </p>
            <div className="mt-4">
              <Badge variant="secondary">In sviluppo</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}