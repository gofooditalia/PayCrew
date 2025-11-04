'use client'

import { useState, useEffect } from 'react'
import { useSidebar } from '@/contexts/sidebar-context'

export default function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const { sidebarState, closeSidebar } = useSidebar()
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
      {/* Main content with appropriate margin based on sidebar state */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${getMarginClass()}`}>
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