import { AttivitaLogger } from '@/lib/attivita-logger'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TestAttivitaEnumFix() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.id) {
    redirect('/login')
  }

  // Test data
  const testUserId = user.id
  const testAziendaId = '0df9a241-0000-0000-0000-000000000000' // Replace with actual azienda ID
  const testDipendente = {
    id: '8b30df5a-b239-4722-86bf-d1ad309d095f',
    nome: 'antonella',
    cognome: 'elia'
  }

  async function testActivityLogging(formData: FormData) {
    'use server'
    
    try {
      // Test the specific activity type that was failing
      await AttivitaLogger.logModificaDipendente(
        testDipendente,
        testUserId,
        testAziendaId
      )
      
      console.log('✅ Activity logged successfully!')
    } catch (error) {
      console.error('❌ Test failed:', error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Attivita Enum Fix</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Test Activity Logging</h2>
        <p className="text-gray-600 mb-4">
          This test verifies that the enum casting issue in the activity logger has been fixed.
        </p>
        
        <form action={testActivityLogging}>
          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Test Activity Logging
          </button>
        </form>
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-medium mb-2">Test Details:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Activity Type: MODIFICA_DIPENDENTE</li>
            <li>Dipendente: {testDipendente.nome} {testDipendente.cognome}</li>
            <li>User ID: {testUserId.substring(0, 8)}...</li>
            <li>Azienda ID: {testAziendaId.substring(0, 8)}...</li>
          </ul>
        </div>
      </div>
    </div>
  )
}