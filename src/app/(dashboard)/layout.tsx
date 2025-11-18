import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma, safePrismaQuery, isDatabaseReachable } from '@/lib/prisma'
import { SidebarProvider } from '@/contexts/sidebar-context'
import Sidebar from '@/components/shared/sidebar'
import SidebarOverlay from '@/components/shared/sidebar-overlay'
import ResponsiveLayout from '@/components/shared/responsive-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  let user: any = null
  
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Dashboard auth error:', error.message)
      redirect('/login')
    }
    
    if (!authUser) {
      redirect('/login')
    }
    
    user = authUser
  } catch (err) {
    console.error('Dashboard auth check error:', err)
    redirect('/login')
  }

  // Check if database is reachable before attempting queries
  const dbReachable = await isDatabaseReachable()
  
  // If database is not reachable, allow app to continue with limited functionality
  if (!dbReachable) {
    console.warn('Database not reachable, proceeding with limited functionality')
    // Allow user to continue without company data
    return (
      <SidebarProvider>
        <div className="flex h-screen bg-background overflow-x-hidden">
          {/* Sidebar */}
          <Sidebar user={user} companyName="PayCrew - Modalità Offline" />

          {/* Main Content with Responsive Layout */}
          <ResponsiveLayout>
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Modalità Offline:</strong> Il database non è attualmente raggiungibile. Alcune funzionalità potrebbero essere limitate.
                  </p>
                </div>
                {children}
              </div>
            </main>
          </ResponsiveLayout>

          {/* Mobile/Tablet Overlay */}
          <SidebarOverlay />
        </div>
      </SidebarProvider>
    )
  }

  // Check if user has an associated company using Prisma with error handling
  const userData = await safePrismaQuery(() =>
    prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })
  ) as { aziendaId?: string } | null

  // If user doesn't have a company, redirect to company creation page
  if (!userData?.aziendaId) {
    redirect('/azienda/crea')
  }

  // Get company data with error handling
  const azienda = await safePrismaQuery(() =>
    prisma.aziende.findUnique({
      where: { id: userData.aziendaId! },
      select: { nome: true }
    })
  ) as { nome?: string } | null

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background overflow-x-hidden">
        {/* Sidebar */}
        <Sidebar user={user} companyName={azienda?.nome} />

        {/* Main Content with Responsive Layout */}
        <ResponsiveLayout>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </ResponsiveLayout>

        {/* Mobile/Tablet Overlay */}
        <SidebarOverlay />
      </div>
    </SidebarProvider>
  )
}