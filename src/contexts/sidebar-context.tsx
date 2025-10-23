'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  sidebarState: 'open' | 'closed' | 'collapsed'
  toggleSidebar: () => void
  closeSidebar: () => void
  openSidebar: () => void
  collapseSidebar: () => void
  isSidebarOpen: boolean
  isSidebarCollapsed: boolean
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarState, setSidebarState] = useState<'open' | 'closed' | 'collapsed'>('open')
  const [isClient, setIsClient] = useState(false)

  // Assicura che il componente sia renderizzato solo sul client
  useEffect(() => {
    setIsClient(true)
    
    // Imposta stato iniziale basato sulla dimensione dello schermo
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) {
        // Su mobile/tablet, sidebar chiusa di default
        setSidebarState('closed')
      } else {
        // Su desktop, sidebar aperta di default
        setSidebarState('open')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarState(prev => {
      // Su desktop, solo cicla tra open e collapsed
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        return prev === 'open' ? 'collapsed' : 'open'
      }
      // Su mobile/tablet, cicla tra tutti e tre gli stati
      if (prev === 'open') return 'collapsed'
      if (prev === 'collapsed') return 'closed'
      return 'open'
    })
  }

  const closeSidebar = () => {
    setSidebarState('closed')
  }

  const openSidebar = () => {
    setSidebarState('open')
  }

  const collapseSidebar = () => {
    setSidebarState('collapsed')
  }

  // Evita rendering mismatch tra server e client
  if (!isClient) {
    return (
      <SidebarContext.Provider value={{
        sidebarState: 'open',
        toggleSidebar,
        closeSidebar,
        openSidebar,
        collapseSidebar,
        isSidebarOpen: true,
        isSidebarCollapsed: false
      }}>
        {children}
      </SidebarContext.Provider>
    )
  }

  return (
    <SidebarContext.Provider value={{
      sidebarState,
      toggleSidebar,
      closeSidebar,
      openSidebar,
      collapseSidebar,
      isSidebarOpen: sidebarState === 'open',
      isSidebarCollapsed: sidebarState === 'collapsed'
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}