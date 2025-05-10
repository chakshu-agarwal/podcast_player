"use client"

import { usePodcast } from "@/context/podcast-context"
import { EpisodeCard } from "@/components/episode-card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Loader2 } from "lucide-react"

export default function HistoryPage() {
  const { history, isLoading } = usePodcast()

  return (
    <ProtectedRoute>
      <div className="py-6 space-y-6">
        <h1 className="text-2xl font-bold">Listening History</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No Listening History</h2>
            <p className="text-muted-foreground">Episodes you've played will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
