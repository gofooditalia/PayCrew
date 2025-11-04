'use client'

import { useSidebar } from '@/contexts/sidebar-context'
import { useEffect } from 'react'

export default function SidebarOverlay() {
  const { sidebarState, closeSidebar } = useSidebar()

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarState === 'open') {
        closeSidebar()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [sidebarState, closeSidebar])

  // Overlay disabled - no visual backdrop
  return null
}