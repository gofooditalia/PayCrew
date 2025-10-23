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
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, enabled: true },
  { name: 'Dipendenti', href: '/dipendenti', icon: UserGroupIcon, enabled: true },
  { name: 'Presenze', href: '/presenze', icon: ClockIcon, enabled: false },
  { name: 'Turni', href: '/turni', icon: CalendarIcon, enabled: false },
  { name: 'Buste Paga', href: '/buste-paga', icon: DocumentTextIcon, enabled: false },
  { name: 'Report', href: '/report', icon: ChartBarIcon, enabled: false },
  { name: 'Impostazioni', href: '/impostazioni', icon: CogIcon, enabled: false },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarState, toggleSidebar } = useSidebar()

  return (
    <div className={`flex flex-col bg-gray-900 transition-all duration-300 ease-in-out ${
      sidebarState === 'open' ? 'w-64' : sidebarState === 'collapsed' ? 'w-16' : 'w-64'
    } ${
      sidebarState === 'closed' ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
    } fixed lg:relative h-full z-40`}>
      <div className="flex items-center h-16 px-4 bg-gray-900 justify-between">
        {sidebarState === 'open' && (
          <h1 className="text-xl font-semibold text-white">PayCrew</h1>
        )}
        {sidebarState === 'collapsed' && (
          <button
            type="button"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={toggleSidebar}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
                           (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            if (item.enabled) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-gray-800 text-white border-r-2 border-indigo-500'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-300'
                    } ${sidebarState === 'collapsed' ? 'h-6 w-6' : 'mr-3 h-5 w-5'}`}
                    aria-hidden="true"
                  />
                  {sidebarState === 'open' && <span>{item.name}</span>}
                  {sidebarState === 'collapsed' && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              )
            } else {
              return (
                <div
                  key={item.name}
                  className="text-gray-500 group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-not-allowed relative"
                >
                  <item.icon
                    className={`${
                      'text-gray-500'
                    } ${sidebarState === 'collapsed' ? 'h-6 w-6' : 'mr-3 h-5 w-5'}`}
                    aria-hidden="true"
                  />
                  {sidebarState === 'open' && (
                    <span className="flex items-center">
                      {item.name}
                      <span className="ml-2 text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                        Presto disponibile
                      </span>
                    </span>
                  )}
                  {sidebarState === 'collapsed' && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-xs text-gray-400 mt-1">Presto disponibile</span>
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