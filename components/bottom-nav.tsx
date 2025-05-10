"use client"

import { Home, Headphones, History, Bookmark, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { usePodcast } from "@/context/podcast-context"

export function BottomNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { isPlaying, pauseEpisode } = usePodcast()

  // Don't render navigation on auth pages or when user is not authenticated
  if (pathname === "/auth" || !user) {
    return null
  }

  // Handle logout with pause functionality
  const handleLogout = () => {
    // If there's audio playing, pause it before logging out
    if (isPlaying) {
      pauseEpisode()
    }

    // Then proceed with logout
    signOut()
  }

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Podcasts",
      href: "/podcasts",
      icon: Headphones,
    },
    {
      name: "Bookmarks",
      href: "/bookmarks",
      icon: Bookmark,
    },
    {
      name: "History",
      href: "/history",
      icon: History,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-20">
      <nav className="flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-3",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center py-2 px-3 text-muted-foreground"
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-xs mt-1">Logout</span>
        </button>
      </nav>
    </div>
  )
}
