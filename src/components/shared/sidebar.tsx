'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSidebar } from '@/contexts/sidebar-context'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import {
  HomeIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon,
  UsersIcon,
  BuildingLibraryIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, enabled: true, isNew: false, inProgress: false },
  { name: 'Dipendenti', href: '/dipendenti', icon: UserGroupIcon, enabled: true, isNew: false, inProgress: false },
  { name: 'Pagamenti', href: '/pagamenti', icon: BuildingLibraryIcon, enabled: true, isNew: false, inProgress: false },
  { name: 'Collaboratori', href: '/collaboratori', icon: UsersIcon, enabled: true, isNew: false, inProgress: false },
  { name: 'Turni', href: '/turni', icon: CalendarIcon, enabled: true, isNew: false, inProgress: false },
  { name: 'Presenze', href: '/presenze', icon: ClockIcon, enabled: true, isNew: false, inProgress: false },
  { name: 'Report', href: '/report', icon: ChartBarIcon, enabled: true, isNew: false, inProgress: false },
  { name: 'Impostazioni', href: '/impostazioni', icon: CogIcon, enabled: true, isNew: false, inProgress: false },
]

interface SidebarProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  companyName?: string;
}

export default function Sidebar({ user, companyName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { sidebarState, toggleSidebar, closeSidebar } = useSidebar()

  // Funzione per gestire il click sui link di navigazione
  const handleLinkClick = () => {
    // Chiudi la sidebar solo su mobile/tablet (schermi < 1024px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      closeSidebar()
    }
  }

  // Funzione per gestire il logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className={`flex flex-col bg-background border-r border-border/50 transition-all duration-300 ease-in-out overflow-x-clip ${
      sidebarState === 'open' ? 'w-64' : sidebarState === 'collapsed' ? 'w-16' : 'w-64'
    } ${
      sidebarState === 'closed' ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
    } fixed lg:relative h-full z-40 shadow-lg`}>
      <div className="flex items-center h-16 px-4 bg-gradient-to-r from-background to-muted/20 border-b border-border/50 justify-between">
        {sidebarState === 'open' && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent truncate" title={companyName || 'PayCrew'}>
              {companyName || 'PayCrew'}
            </h1>
            <button
              type="button"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all duration-200 button-scale flex-shrink-0 ml-2"
              onClick={toggleSidebar}
              aria-label="Collassa menu laterale"
            >
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
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
                        <span className="text-xs font-bold bg-success text-success-foreground px-2 py-0.5 rounded-full shadow-sm" aria-label="Nuova funzionalità">
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
                          <span className="text-xs font-bold bg-success text-success-foreground px-1.5 py-0.5 rounded-full" aria-label="Nuova funzionalità">
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
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        item.inProgress
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.inProgress ? 'In lavorazione' : 'Presto'}
                      </span>
                    </span>
                  )}
                  {sidebarState === 'collapsed' && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gradient-to-r from-popover to-background text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-border/50 backdrop-blur-sm">
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {item.inProgress ? 'In lavorazione' : 'Presto disponibile'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          })}
        </nav>

        {/* Sezione inferiore con notifiche e profilo */}
        <div className="border-t border-border/50 bg-gradient-to-r from-background to-muted/20">
          <div className="px-2 py-3 space-y-2">
            {/* Notifiche */}
            <button
              type="button"
              className={`${
                sidebarState === 'collapsed'
                  ? 'w-full flex justify-center'
                  : 'w-full flex items-center gap-3 px-3'
              } py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 group relative`}
              aria-label="Notifiche"
            >
              <BellIcon className={`${sidebarState === 'collapsed' ? 'h-6 w-6' : 'h-5 w-5'}`} aria-hidden="true" />
              {sidebarState === 'open' && <span className="text-sm font-medium">Notifiche</span>}
              {sidebarState === 'collapsed' && (
                <div className="fixed left-[4.5rem] px-2 py-1 bg-gradient-to-r from-popover to-background text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-border/50 backdrop-blur-sm">
                  Notifiche
                </div>
              )}
            </button>

            {/* Profilo utente */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`${
                    sidebarState === 'collapsed'
                      ? 'w-full flex justify-center'
                      : 'w-full flex items-center gap-3 px-3'
                  } py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 group relative`}
                  aria-label="Menu profilo utente"
                >
                  <UserCircleIcon className={`${sidebarState === 'collapsed' ? 'h-6 w-6' : 'h-5 w-5'}`} aria-hidden="true" />
                  {sidebarState === 'open' && <span className="text-sm font-medium truncate flex-1 text-left">{user?.email}</span>}
                  {sidebarState === 'collapsed' && (
                    <div className="fixed left-[4.5rem] px-2 py-1 bg-gradient-to-r from-popover to-background text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-border/50 backdrop-blur-sm">
                      Profilo
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end" side="right" forceMount>
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground">Loggato come</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/azienda/modifica')}>
                  <span className="flex items-center gap-2 w-full">
                    Profilo Azienda
                    <span className="text-xs font-bold bg-success text-success-foreground px-2 py-0.5 rounded-full" aria-label="Nuova funzionalità">
                      Nuovo
                    </span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/changelog')}>
                  Novità e Changelog
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}