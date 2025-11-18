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
  const [sidebarState, setSidebarState] = useState<'open' | 'closed' | 'collapsed'>('collapsed')
  const [isClient, setIsClient] = useState(false)

  // Assicura che il componente sia renderizzato solo sul client
  useEffect(() => {
    setIsClient(true)

    // Imposta stato iniziale basato sulla dimensione dello schermo e localStorage
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) {
        // Su mobile/tablet, sidebar chiusa di default
        setSidebarState('closed')
      } else {
        // Su desktop, legge preferenza salvata o collapsed di default
        const savedState = localStorage.getItem('sidebar-state') as 'open' | 'collapsed' | null
        setSidebarState(savedState && (savedState === 'open' || savedState === 'collapsed') ? savedState : 'collapsed')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  // Salva lo stato nel localStorage quando cambia (solo su desktop)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      if (sidebarState === 'open' || sidebarState === 'collapsed') {
        localStorage.setItem('sidebar-state', sidebarState)
      }
    }
  }, [sidebarState, isClient])

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
        sidebarState: 'collapsed',
        toggleSidebar,
        closeSidebar,
        openSidebar,
        collapseSidebar,
        isSidebarOpen: false,
        isSidebarCollapsed: true
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