"use client"

import { usePodcast } from "@/context/podcast-context"
import { EpisodeCard } from "@/components/episode-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { notFound } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function PodcastDetailPage() {
  const params = useParams()
  const { podcasts, isLoading } = usePodcast()

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ProtectedRoute>
    )
  }

  const podcast = podcasts.find((p) => p.id === params.id)

  if (!podcast) {
    notFound()
  }

  return (
    <ProtectedRoute>
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/podcasts">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Podcast Details</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="relative w-full sm:w-40 h-40 flex-shrink-0">
            <Image
              src={podcast.imageUrl || "/placeholder.svg?height=160&width=160"}
              alt={podcast.title}
              fill
              className="object-cover rounded-md"
            />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold">{podcast.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{podcast.author}</p>

            <div className="mt-4 text-sm">
              <p className="line-clamp-4">{podcast.description}</p>
            </div>

            <p className="text-sm mt-4">
              <span className="font-medium">{podcast.episodes.length}</span> episodes
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Episodes</h3>

          {podcast.episodes.length === 0 ? (
            <p className="text-muted-foreground">No episodes found</p>
          ) : (
            <div className="space-y-4">
              {podcast.episodes.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} showPodcastTitle={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
