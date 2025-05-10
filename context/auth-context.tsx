"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react"
import type { Session, User } from "@supabase/supabase-js"
import { createAudioPauseEvent } from "@/lib/events"
import type { Database } from "@/types/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
    success: boolean
    existingUser?: boolean
  }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
    success: boolean
  }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use the Supabase client from the context
  const supabase = useSupabaseClient<Database>()
  // Get the session from the context
  const session = useSession()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Update user when session changes
  useEffect(() => {
    setUser(session?.user ?? null)
    setIsLoading(false)
  }, [session])

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setUser(currentSession?.user ?? null)
      setIsLoading(false)

      // If user is logging out (session becomes null), trigger audio pause
      if (!currentSession) {
        // Dispatch a custom event to notify podcast context to pause playback
        window.dispatchEvent(createAudioPauseEvent())
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signUp = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      })

      // Check if the error is because the user already exists
      const isExistingUserError =
        error?.message?.includes("already registered") ||
        error?.message?.includes("already in use") ||
        error?.message?.includes("already exists")

      if (isExistingUserError) {
        return { error, success: false, existingUser: true }
      }

      return { error, success: !error }
    } catch (error) {
      return { error: error as Error, success: false }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error, success: !error }
    } catch (error) {
      return { error: error as Error, success: false }
    }
  }

  const signOut = async () => {
    // Dispatch event to pause audio before signing out
    window.dispatchEvent(createAudioPauseEvent())

    // Then sign out
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
