'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/contexts/sidebar-context'
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

interface HeaderProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  companyName?: string;
}

export default function Header({ user, companyName }: HeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { sidebarState, toggleSidebar } = useSidebar()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-gradient-to-r from-background via-background to-muted/20 border-b shadow-lg backdrop-blur-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Company Name and Burger Menu */}
          <div className="flex items-center">
            {/* Burger menu - visible when sidebar is open, hidden when collapsed */}
            {sidebarState !== 'collapsed' && (
              <button
                type="button"
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary mr-4 transition-all duration-200 ease-in-out"
                onClick={toggleSidebar}
                aria-label="Apri menu laterale"
              >
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
            
            {/* Company Name */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent" title={companyName || 'PayCrew'}>
                {companyName || 'PayCrew'}
              </h1>
            </div>
          </div>

          {/* Right side of header - Notifications and User */}
          <div className="flex items-center space-x-4 ml-4">
            {/* Notifications - Hidden on mobile, visible on desktop and tablet */}
            <button
              type="button"
              className="hidden sm:block p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ease-in-out relative"
              aria-label="Notifiche"
            >
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-label="Menu profilo utente"
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
              >
                <span className="sr-only">Apri menu utente</span>
                <UserCircleIcon className="h-8 w-8 text-muted-foreground hover:text-primary transition-all duration-200 ease-in-out" aria-hidden="true" />
              </button>

              {profileMenuOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-xl bg-gradient-to-br from-popover to-background ring-1 ring-border divide-y divide-border focus:outline-none z-50 transition-all duration-200 backdrop-blur-sm"
                  role="menu"
                >
                  <div className="px-4 py-3" role="none">
                    <p className="text-sm text-muted-foreground" role="none">Loggato come</p>
                    <p className="text-sm font-medium text-foreground truncate" role="none">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1" role="none">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      role="menuitem"
                    >
                      Esci
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}