import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  try {
    const cookieStore = await cookies()

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              return cookieStore.get(name)?.value
            } catch {
              return null
            }
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch {
              // Handle cookie errors silently
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch {
              // Handle cookie errors silently
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    // Return a client with minimal functionality for error cases
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: () => null,
          set: () => {},
          remove: () => {},
        },
      }
    )
  }
}