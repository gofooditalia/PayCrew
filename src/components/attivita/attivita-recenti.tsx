'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  UserPlusIcon,
  PencilIcon,
  UserMinusIcon,
  ClockIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface Attivita {
  id: string
  tipoAttivita: string
  descrizione: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  datiAggiuntivi?: Record<string, unknown>
}

interface AttivitaRecentiProps {
  limit?: number
  className?: string
}

export function AttivitaRecenti({ limit = 10, className }: AttivitaRecentiProps) {
  const [attivita, setAttivita] = useState<Attivita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttivita = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/attivita?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Errore durante il recupero delle attività')
      }
      
      const data = await response.json()
      setAttivita(data.attivita || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchAttivita()
  }, [fetchAttivita])

  const handleRefresh = () => {
    fetchAttivita()
  }

  const getIconForTipoAttivita = (tipoAttivita: string) => {
    switch (tipoAttivita) {
      case 'CREAZIONE_DIPENDENTE':
        return <UserPlusIcon className="h-4 w-4 text-green-600" />
      case 'MODIFICA_DIPENDENTE':
        return <PencilIcon className="h-4 w-4 text-blue-600" />
      case 'ELIMINAZIONE_DIPENDENTE':
        return <UserMinusIcon className="h-4 w-4 text-red-600" />
      case 'REGISTRAZIONE_PRESENZA':
        return <ClockIcon className="h-4 w-4 text-purple-600" />
      case 'GENERAZIONE_BUSTA_PAGA':
        return <DocumentTextIcon className="h-4 w-4 text-orange-600" />
      case 'RICHIESTA_FERIE':
        return <CalendarIcon className="h-4 w-4 text-yellow-600" />
      case 'APPROVAZIONE_FERIE':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case 'RIFIUTO_FERIE':
        return <XCircleIcon className="h-4 w-4 text-red-600" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const getBadgeVariantForTipoAttivita = (tipoAttivita: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (tipoAttivita) {
      case 'CREAZIONE_DIPENDENTE':
      case 'APPROVAZIONE_FERIE':
        return 'default'
      case 'MODIFICA_DIPENDENTE':
      case 'REGISTRAZIONE_PRESENZA':
        return 'secondary'
      case 'ELIMINAZIONE_DIPENDENTE':
      case 'RIFIUTO_FERIE':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatTipoAttivita = (tipoAttivita: string) => {
    return tipoAttivita
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Attività Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Attività Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600">Errore nel caricamento delle attività</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (attivita.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Attività Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nessuna attività recente</p>
            <p className="text-sm text-gray-500">Le attività appariranno qui</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Attività Recenti</CardTitle>
          <button
            onClick={handleRefresh}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            disabled={loading}
          >
            {loading ? 'Aggiornamento...' : 'Aggiorna'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {attivita.map((item) => (
            <div key={item.id} className="flex items-start space-x-4">
              <div className="mt-1">
                {getIconForTipoAttivita(item.tipoAttivita)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant={getBadgeVariantForTipoAttivita(item.tipoAttivita)}>
                    {formatTipoAttivita(item.tipoAttivita)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(item.createdAt), { 
                      addSuffix: true, 
                      locale: it 
                    })}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {item.descrizione}
                </p>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {item.user.name?.charAt(0) || item.user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-gray-600">
                    {item.user.name || item.user.email}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}