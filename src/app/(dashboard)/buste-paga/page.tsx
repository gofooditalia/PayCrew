import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function BustePagaPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Buste Paga</h1>
        <p className="text-gray-600 mb-4">Visualizza e genera buste paga per i dipendenti</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Buste Paga Dipendenti</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Generazione e visualizzazione delle buste paga mensili.
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