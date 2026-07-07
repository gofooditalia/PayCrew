'use client'

import { useState, useEffect } from 'react'
import { useSidebar } from '@/contexts/sidebar-context'
import { Bars3Icon } from '@heroicons/react/24/outline'

export default function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const { sidebarState, closeSidebar, openSidebar } = useSidebar()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      // Chiudi la sidebar su mobile quando la dimensione cambia
      if (window.innerWidth < 1024) {
        // Non modificare lo stato qui, lascia che sia gestito dal contesto
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calcola i margini in base allo stato della sidebar
  const getMarginClass = () => {
    if (isMobile) return '' // Su mobile non ci sono margini
    if (sidebarState === 'open') return 'lg:ml-0' // Sidebar aperta
    if (sidebarState === 'collapsed') return 'lg:ml-0' // Sidebar collassata
    return 'lg:ml-0' // Sidebar chiusa
  }

  return (
    <>
      {/* Mobile top bar with burger button - only shown when sidebar is closed (mobile default state) */}
      {sidebarState === 'closed' && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-center h-16 px-4 bg-gradient-to-r from-background to-muted/20 border-b border-border/50">
          <button
            type="button"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all duration-200"
            onClick={openSidebar}
            aria-label="Apri menu laterale"
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="ml-3 text-lg font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            PayCrew
          </h1>
        </div>
      )}

      {/* Main content with appropriate margin based on sidebar state */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${getMarginClass()} ${sidebarState === 'closed' ? 'pt-16 lg:pt-0' : ''}`}>
        {children}
      </div>

      {/* Mobile overlay with gray backdrop - only shown when sidebar is open on mobile */}
      {sidebarState === 'open' && isMobile && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-30 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}
    </>
  )
}