'use client'

/**
 * Pagina Impostazioni
 *
 * Gestione centralizzata delle impostazioni aziendali:
 * - Orari di lavoro standard
 * - Fasce orarie predefinite
 * - Festività e chiusure aziendali
 */

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrariLavoroTab } from '@/components/impostazioni/orari-lavoro-tab'
import { FasceOrarieTab } from '@/components/impostazioni/fasce-orarie-tab'
import { FestivitaTab } from '@/components/impostazioni/festivita-tab'
import { Clock, Calendar, Sparkles } from 'lucide-react'

export default function ImpostazioniPage() {
  const [activeTab, setActiveTab] = useState('orari-lavoro')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
        <p className="text-muted-foreground mt-2">
          Configura gli orari di lavoro, le fasce orarie e le festività aziendali
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="orari-lavoro" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Orari Lavoro</span>
            <span className="sm:hidden">Orari</span>
          </TabsTrigger>
          <TabsTrigger value="fasce-orarie" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Fasce Orarie</span>
            <span className="sm:hidden">Fasce</span>
          </TabsTrigger>
          <TabsTrigger value="festivita" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Festività</span>
            <span className="sm:hidden">Feste</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orari-lavoro" className="space-y-4">
          <OrariLavoroTab />
        </TabsContent>

        <TabsContent value="fasce-orarie" className="space-y-4">
          <FasceOrarieTab />
        </TabsContent>

        <TabsContent value="festivita" className="space-y-4">
          <FestivitaTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
