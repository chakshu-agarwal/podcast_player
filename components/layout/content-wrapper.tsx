"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface ContentWrapperProps {
  children: React.ReactNode
  className?: string
}

export function ContentWrapper({ children, className }: ContentWrapperProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  // Determine if we need bottom padding for the navigation bar
  const needsBottomPadding = user && pathname !== "/auth"

  return <div className={cn(className, needsBottomPadding ? "pb-24" : "pb-4")}>{children}</div>
}
