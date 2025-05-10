"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { AuthForm } from "@/components/auth/auth-form"
import { Loader2 } from "lucide-react"
import { ContentWrapper } from "@/components/layout/content-wrapper"

export default function AuthPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      <div className="py-12 px-4">
        <div className="max-w-md mx-auto text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome to Podcast Player</h1>
          <p className="text-muted-foreground">Sign in or create an account to sync your podcasts across devices</p>
        </div>
        <AuthForm />
      </div>
    </ContentWrapper>
  )
}
