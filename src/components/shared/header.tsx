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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Company Name and Burger Menu */}
          <div className="flex items-center">
            {/* Burger menu - visible when sidebar is open, hidden when collapsed */}
            {sidebarState !== 'collapsed' && (
              <button
                type="button"
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 mr-4"
                onClick={toggleSidebar}
              >
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
            
            {/* Company Name - visible on all screen sizes */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {companyName || 'PayCrew'}
              </h1>
            </div>
          </div>

          {/* Right side of header - Notifications and User */}
          <div className="flex items-center space-x-4 ml-4">
            {/* Notifications - Hidden on mobile, visible on desktop and tablet */}
            <button
              type="button"
              className="hidden sm:block p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <span className="sr-only">Apri menu utente</span>
                <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
              </button>

              {profileMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50">
                  <div className="px-4 py-3">
                    <p className="text-sm">Loggato come</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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