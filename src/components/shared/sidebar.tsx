'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CalendarIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Dipendenti', href: '/dipendenti', icon: UserGroupIcon },
  { name: 'Presenze', href: '/presenze', icon: ClockIcon },
  { name: 'Turni', href: '/turni', icon: CalendarIcon },
  { name: 'Buste Paga', href: '/buste-paga', icon: DocumentTextIcon },
  { name: 'Report', href: '/report', icon: ChartBarIcon },
  { name: 'Impostazioni', href: '/impostazioni', icon: CogIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-gray-900">
      <div className="flex items-center h-16 px-4 bg-gray-900">
        <h1 className="text-xl font-semibold text-white">PayCrew</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
                           (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
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
                  } mr-3 h-5 w-5`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}