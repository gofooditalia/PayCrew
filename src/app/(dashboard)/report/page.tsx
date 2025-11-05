'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportCedolini } from '@/components/report/report-cedolini'
import { ReportPresenze } from '@/components/report/report-presenze'

export default function ReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report</h1>
        <p className="text-muted-foreground">
          Analizza cedolini, presenze e costi aziendali
        </p>
      </div>

      <Tabs defaultValue="cedolini" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cedolini">Report Cedolini</TabsTrigger>
          <TabsTrigger value="presenze">Report Presenze</TabsTrigger>
        </TabsList>

        <TabsContent value="cedolini" className="space-y-4">
          <ReportCedolini />
        </TabsContent>

        <TabsContent value="presenze" className="space-y-4">
          <ReportPresenze />
        </TabsContent>
      </Tabs>
    </div>
  )
}