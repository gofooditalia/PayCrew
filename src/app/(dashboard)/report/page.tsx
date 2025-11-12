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

      <Tabs defaultValue="presenze" className="space-y-4">
        <TabsList>
          <TabsTrigger value="presenze">Report Presenze</TabsTrigger>
          <TabsTrigger value="cedolini" disabled className="relative">
            <span>Report Cedolini</span>
            <span className="ml-2 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">
              In lavorazione
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presenze" className="space-y-4">
          <ReportPresenze />
        </TabsContent>

        <TabsContent value="cedolini" className="space-y-4">
          <ReportCedolini />
        </TabsContent>
      </Tabs>
    </div>
  )
}