import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ReportPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Report</h1>
        <p className="text-gray-600 mb-4">Visualizza report e analisi delle attività</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Attività</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Report delle attività recenti con filtri e statistiche.
            </p>
            <div className="mt-4">
              <Badge variant="secondary">In sviluppo</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Buste Paga</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Report delle buste paga generate per dipendenti.
            </p>
            <div className="mt-4">
              <Badge variant="secondary">In sviluppo</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Presenze</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Report delle presenze e assenze dei dipendenti.
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