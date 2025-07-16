import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { supabaseService } from '../services/supabaseService'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email || 'No session')
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Immediately set user in service to prevent race condition
      supabaseService.setUser(session?.user?.id ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email || 'No user')
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Immediately set user in service to prevent race condition
        supabaseService.setUser(session?.user?.id ?? null)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in:', session.user.email)
          
          // Create user record if it doesn't exist
          const { error } = await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              created_at: new Date().toISOString()
            })
          
          if (error) {
            console.error('Error creating user record:', error)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      console.log('Attempting to sign out...')
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
      
      await Promise.race([
        supabase.auth.signOut(),
        timeout
      ])
      
      console.log('Sign out successful')
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
      // Force sign out by clearing local storage and reloading
      localStorage.clear()
      window.location.reload()
    }
  }

  const value = {
    user,
    loading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}