"use client"

import { usePodcast, type Episode } from "@/context/podcast-context"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"

interface EpisodeCardProps {
  episode: Episode
  showPodcastTitle?: boolean
}

export function EpisodeCard({ episode, showPodcastTitle = true }: EpisodeCardProps) {
  const { currentEpisode, isPlaying, playEpisode, pauseEpisode } = usePodcast()
  const { user } = useAuth()

  const isCurrentEpisode = currentEpisode?.id === episode.id
  const isCurrentlyPlaying = isCurrentEpisode && isPlaying

  // Disable play button for other episodes when one is playing
  const isDisabled = isPlaying && !isCurrentEpisode

  const handlePlayPause = () => {
    if (isCurrentEpisode) {
      if (isPlaying) {
        pauseEpisode()
      } else {
        playEpisode(episode)
      }
    } else if (!isPlaying) {
      // Only allow playing if no other episode is currently playing
      playEpisode(episode)
    }
  }

  // Format progress percentage
  const progressPercentage = Math.round(episode.progress * 100)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          <div className="relative w-16 h-16 flex-shrink-0">
            <Image
              src={episode.imageUrl || "/placeholder.svg?height=64&width=64"}
              alt={episode.podcastTitle}
              fill
              className="object-cover rounded-md"
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h3 className="font-medium line-clamp-2">{episode.title}</h3>
              {showPodcastTitle && <p className="text-sm text-muted-foreground">{episode.podcastTitle}</p>}
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">{formatDate(episode.pubDate)}</span>

              {episode.progress > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{progressPercentage}%</span>
                  <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${episode.progress * 100}%` }}
                      aria-label={`${progressPercentage}% complete`}
                    />
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-full", isDisabled && "opacity-30 cursor-not-allowed")}
                onClick={handlePlayPause}
                disabled={isDisabled}
                aria-label={isCurrentlyPlaying ? "Pause" : "Play"}
              >
                {isCurrentlyPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
