"use client"

import type React from "react"
import { Inter } from "next/font/google"
import { PodcastProvider } from "@/context/podcast-context"
import { AuthProvider } from "@/context/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Player } from "@/components/player"
import { BottomNav } from "@/components/bottom-nav"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import type { Database } from "@/types/supabase"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Create the Supabase client using the auth-helpers-nextjs package
  const supabaseClient = createClientComponentClient<Database>()

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          forcedTheme={undefined}
        >
          {/* Wrap the AuthProvider with SessionContextProvider */}
          <SessionContextProvider supabaseClient={supabaseClient} initialSession={null}>
            <AuthProvider>
              <PodcastProvider>
                <div className="flex flex-col min-h-screen">
                  <main className="flex-1 container mx-auto px-4">{children}</main>
                  <Player />
                  <BottomNav />
                </div>
              </PodcastProvider>
            </AuthProvider>
          </SessionContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
