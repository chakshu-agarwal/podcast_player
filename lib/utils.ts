import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "00:00"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function formatDate(dateString: string): string {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) return ""

    // If it's today
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    }

    // If it's yesterday
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    }

    // If it's within the last 7 days
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    if (date > lastWeek) {
      return date.toLocaleDateString("en-US", { weekday: "long" })
    }

    // Otherwise, show the date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    })
  } catch (error) {
    return ""
  }
}
