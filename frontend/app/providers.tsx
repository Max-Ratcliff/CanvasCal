"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"
import { ReactNode, createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Session, User } from "@supabase/supabase-js"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

type AuthContextType = {
  session: Session | null
  user: User | null
  token: string | null
  isLoading: boolean
  signIn: (email?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function Providers({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setToken(session?.access_token ?? null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setToken(session?.access_token ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email?: string) => {
    if (!email) {
        // Fallback or error if no email provided for OTP
        return
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (!GOOGLE_CLIENT_ID) {
    console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing!")
  }

  return (
    <AuthContext.Provider value={{ session, user, token, isLoading, signIn, signOut }}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {children}
      </GoogleOAuthProvider>
    </AuthContext.Provider>
  )
}
