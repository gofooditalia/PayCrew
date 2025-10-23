import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SidebarProvider } from '@/contexts/sidebar-context'
import Sidebar from '@/components/shared/sidebar'
import SidebarOverlay from '@/components/shared/sidebar-overlay'
import ResponsiveLayout from '@/components/shared/responsive-layout'
import Header from '@/components/shared/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user has an associated company using Prisma
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { aziendaId: true }
  })

  // If user doesn't have a company, redirect to company creation page
  if (!userData?.aziendaId) {
    redirect('/azienda/crea')
  }

  // Get company data
  const azienda = await prisma.azienda.findUnique({
    where: { id: userData.aziendaId },
    select: { nome: true }
  })

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content with Responsive Layout */}
        <ResponsiveLayout>
          <Header user={user} companyName={azienda?.nome} />
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