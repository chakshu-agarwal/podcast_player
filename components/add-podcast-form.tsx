"use client"

import type React from "react"

import { useState } from "react"
import { usePodcast } from "@/context/podcast-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface AddPodcastFormProps {
  onSuccess?: () => void
}

export function AddPodcastForm({ onSuccess }: AddPodcastFormProps) {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addPodcast } = usePodcast()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url) {
      setError("Please enter a podcast RSS feed URL")
      return
    }

    if (!user) {
      setError("You must be logged in to add podcasts")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await addPodcast(url)
      setUrl("")
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("Error adding podcast:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to add podcast. Please check the URL and try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="url"
          placeholder="Enter podcast RSS feed URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button type="submit" disabled={isLoading || !user} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          "Add Podcast"
        )}
      </Button>

      {!user && <p className="text-sm text-amber-500">Please log in to add podcasts</p>}

      <div className="text-xs text-muted-foreground">
        <p>Example RSS feeds:</p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li>https://feeds.simplecast.com/54nAGcIl</li>
          <li>https://feeds.megaphone.fm/vergecast</li>
          <li>https://lexfridman.com/feed/podcast/</li>
        </ul>
      </div>
    </form>
  )
}
