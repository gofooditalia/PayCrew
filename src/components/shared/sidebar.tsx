'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/contexts/sidebar-context'
import {
  HomeIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, enabled: true, isNew: false },
  { name: 'Dipendenti', href: '/dipendenti', icon: UserGroupIcon, enabled: true, isNew: false },
  { name: 'Presenze', href: '/presenze', icon: ClockIcon, enabled: true, isNew: true },
  { name: 'Turni', href: '/turni', icon: CalendarIcon, enabled: false, isNew: false },
  { name: 'Buste Paga', href: '/buste-paga', icon: DocumentTextIcon, enabled: false, isNew: false },
  { name: 'Report', href: '/report', icon: ChartBarIcon, enabled: false, isNew: false },
  { name: 'Impostazioni', href: '/impostazioni', icon: CogIcon, enabled: false, isNew: false },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarState, toggleSidebar, closeSidebar } = useSidebar()

  // Funzione per gestire il click sui link di navigazione
  const handleLinkClick = () => {
    // Chiudi la sidebar solo su mobile/tablet (schermi < 1024px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      closeSidebar()
    }
  }

  return (
    <div className={`flex flex-col bg-gradient-to-b from-background via-background to-muted/10 border-r border-border/50 transition-all duration-300 ease-in-out ${
      sidebarState === 'open' ? 'w-64' : sidebarState === 'collapsed' ? 'w-16' : 'w-64'
    } ${
      sidebarState === 'closed' ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
    } fixed lg:relative h-full z-40 shadow-lg`}>
      <div className="flex items-center h-16 px-4 bg-gradient-to-r from-background to-muted/20 border-b border-border/50 justify-between">
        {sidebarState === 'open' && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">PayCrew</h1>
        )}
        {sidebarState === 'collapsed' && (
          <button
            type="button"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all duration-200 button-scale"
            onClick={toggleSidebar}
            aria-label="Espandi menu laterale"
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1" role="navigation" aria-label="Navigazione principale">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
                           (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            if (item.enabled) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`${
                    isActive
                      ? 'bg-gradient-to-r from-accent to-primary/10 text-foreground border-l-4 border-primary shadow-md'
                      : 'text-muted-foreground hover:bg-gradient-to-r hover:from-accent/50 hover:to-primary/5 hover:text-foreground'
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-r-md transition-all duration-200 ease-in-out`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                    } ${sidebarState === 'collapsed' ? 'h-6 w-6' : 'mr-3 h-5 w-5'} transition-all duration-200 ease-in-out`}
                    aria-hidden="true"
                  />
                  {sidebarState === 'open' && (
                    <span className="flex items-center gap-2">
                      {item.name}
                      {item.isNew && (
                        <span className="text-[10px] font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                          Nuovo
                        </span>
                      )}
                    </span>
                  )}
                  {sidebarState === 'collapsed' && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gradient-to-r from-popover to-background text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-border/50 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        {item.name}
                        {item.isNew && (
                          <span className="text-[10px] font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                            Nuovo
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              )
            } else {
              return (
                <div
                  key={item.name}
                  className="text-muted-foreground group flex items-center px-3 py-2 text-sm font-medium rounded-r-md cursor-not-allowed relative opacity-60"
                  role="button"
                  tabIndex={-1}
                  aria-disabled="true"
                >
                  <item.icon
                    className={`text-muted-foreground ${sidebarState === 'collapsed' ? 'h-6 w-6' : 'mr-3 h-5 w-5'}`}
                    aria-hidden="true"
                  />
                  {sidebarState === 'open' && (
                    <span className="flex items-center">
                      {item.name}
                      <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        Presto
                      </span>
                    </span>
                  )}
                  {sidebarState === 'collapsed' && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gradient-to-r from-popover to-background text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-border/50 backdrop-blur-sm">
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-xs text-muted-foreground mt-1">Presto disponibile</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          })}
        </nav>
      </div>
    </div>
  )
}