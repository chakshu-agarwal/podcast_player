import type React from "react"
import "./globals.css"
import ClientLayout from "./client-layout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Podcast Player",
  description: "A mobile podcast player application",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}
