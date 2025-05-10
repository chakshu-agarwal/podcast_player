"use client"

import { usePodcast } from "@/context/podcast-context"
import { useAuth } from "@/context/auth-context"
import { Pause, Play, SkipBack, SkipForward, ChevronDown, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"
import { formatTime } from "@/lib/utils"
import { useState, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePathname } from "next/navigation"

export function Player() {
  const {
    currentEpisode,
    isPlaying,
    progress,
    volume,
    currentTime,
    playbackSpeed,
    playEpisode,
    pauseEpisode,
    setProgress,
    setVolume,
    setPlaybackSpeed,
    addBookmark,
    skipForward,
    skipBackward,
    updateEpisodeProgress,
  } = usePodcast()

  const { user } = useAuth()
  const pathname = usePathname()

  const [duration, setDuration] = useState(0)
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false)
  const [bookmarkNote, setBookmarkNote] = useState("")
  const [capturedTimestamp, setCapturedTimestamp] = useState<number | null>(null)
  const [wasPlayingBeforeBookmark, setWasPlayingBeforeBookmark] = useState(false)

  // Don't render player on auth pages or when user is not authenticated
  const shouldRenderPlayer = pathname !== "/auth" && user !== null

  // Available playback speeds from 0.5x to 3x in 0.25 increments
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3]

  useEffect(() => {
    if (currentEpisode && progress !== undefined) {
      // Estimate duration from the itunes:duration if available
      let estimatedDuration = 0
      if (currentEpisode.duration) {
        // Ensure duration is a string before splitting
        const durationStr = String(currentEpisode.duration)

        if (durationStr.includes(":")) {
          const parts = durationStr.split(":")
          if (parts.length === 3) {
            // HH:MM:SS format
            estimatedDuration =
              Number.parseInt(parts[0]) * 3600 + Number.parseInt(parts[1]) * 60 + Number.parseInt(parts[2])
          } else if (parts.length === 2) {
            // MM:SS format
            estimatedDuration = Number.parseInt(parts[0]) * 60 + Number.parseInt(parts[1])
          }
        } else {
          // Seconds format - handle as number or string
          estimatedDuration = Number.parseInt(durationStr)
        }
      }

      if (estimatedDuration) {
        setDuration(estimatedDuration)
      }
    }
  }, [currentEpisode, progress])

  if (!currentEpisode || !shouldRenderPlayer) {
    return null
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseEpisode()
    } else {
      playEpisode(currentEpisode)
    }
  }

  const handleAddBookmark = () => {
    // Capture the current timestamp immediately when the bookmark icon is clicked
    if (currentTime) {
      setCapturedTimestamp(currentTime)

      // Remember if we were playing before opening the dialog
      setWasPlayingBeforeBookmark(isPlaying)

      // Optionally pause playback while adding a bookmark
      if (isPlaying) {
        pauseEpisode()
      }

      setShowBookmarkDialog(true)
    }
  }

  const handleSaveBookmark = () => {
    if (capturedTimestamp !== null) {
      // Use the captured timestamp instead of the current time
      addBookmark(bookmarkNote.trim() || undefined, capturedTimestamp)
      setBookmarkNote("")
      setCapturedTimestamp(null)
      setShowBookmarkDialog(false)

      // Resume playback if it was playing before
      if (wasPlayingBeforeBookmark) {
        playEpisode(currentEpisode)
        setWasPlayingBeforeBookmark(false)
      }
    }
  }

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0] / 100
    setProgress(newProgress)

    // This will update the displayed percentage in the EpisodeCard component
    if (currentEpisode) {
      updateEpisodeProgress(currentEpisode, newProgress)
    }
  }

  return (
    <>
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t p-2 z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src={currentEpisode.imageUrl || "/placeholder.svg?height=48&width=48"}
              alt={currentEpisode.title}
              fill
              className="object-cover rounded-md"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentEpisode.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentEpisode.podcastTitle}</p>
          </div>

          <div className="flex items-center gap-1">
            {/* Playback Speed Control */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs font-medium text-emerald-500 hover:text-emerald-600"
                >
                  {playbackSpeed}x
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-16 max-h-60 overflow-y-auto">
                {speeds.map((speed) => (
                  <DropdownMenuItem
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={playbackSpeed === speed ? "bg-accent font-medium" : ""}
                  >
                    {speed}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bookmark Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-yellow-500"
              onClick={handleAddBookmark}
              aria-label="Add bookmark at current position"
            >
              <Bookmark className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={skipBackward}
              aria-label="Skip backward 15 seconds"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={skipForward}
              aria-label="Skip forward 30 seconds"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-xs w-8 text-muted-foreground">{formatTime(currentTime)}</span>
          <Slider
            value={[progress * 100]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={handleProgressChange}
            className="flex-1"
            aria-label="Playback progress"
          />
          <span className="text-xs w-8 text-right text-muted-foreground">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Bookmark Dialog */}
      <Dialog
        open={showBookmarkDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowBookmarkDialog(false)
            setCapturedTimestamp(null)

            // Resume playback if it was playing before
            if (wasPlayingBeforeBookmark) {
              playEpisode(currentEpisode)
              setWasPlayingBeforeBookmark(false)
            }
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bookmark at {formatTime(capturedTimestamp || 0)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bookmark-note">Note (optional)</Label>
              <Textarea
                id="bookmark-note"
                placeholder="Add a note about this bookmark..."
                value={bookmarkNote}
                onChange={(e) => setBookmarkNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookmarkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBookmark}>Save Bookmark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
