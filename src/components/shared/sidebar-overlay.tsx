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

  if (sidebarState !== 'open') return null

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 lg:hidden transition-opacity ease-in-out duration-300"
      onClick={closeSidebar}
      aria-hidden="true"
    />
  )
}