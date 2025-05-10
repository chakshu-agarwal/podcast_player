"use client"

import { usePodcast } from "@/context/podcast-context"
import { useAuth } from "@/context/auth-context"
import { EpisodeCard } from "@/components/episode-card"
import { AddPodcastForm } from "@/components/add-podcast-form"
import { Button } from "@/components/ui/button"
import { PlusCircle, LogIn } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { ContentWrapper } from "@/components/layout/content-wrapper"

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const { podcasts, isLoading: podcastsLoading } = usePodcast()
  const [open, setOpen] = useState(false)

  const isLoading = authLoading || podcastsLoading

  // Get all episodes from all podcasts and sort by publication date
  const allEpisodes = podcasts
    .flatMap((podcast) => podcast.episodes)
    .sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime()
      const dateB = new Date(b.pubDate).getTime()
      return dateB - dateA // Sort in descending order (newest first)
    })

  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ContentWrapper>
    )
  }

  if (!user) {
    return (
      <ContentWrapper>
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Podcast Player</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Sign in to start listening to your favorite podcasts and sync your progress across devices.
          </p>
          <Button asChild size="lg">
            <Link href="/auth">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In or Register
            </Link>
          </Button>
        </div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Latest Episodes</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                <span>Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Podcast</DialogTitle>
              </DialogHeader>
              <AddPodcastForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {podcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Welcome to Podcast Player</h2>
            <p className="text-muted-foreground mb-6">Add your first podcast to get started</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Podcast
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Podcast</DialogTitle>
                </DialogHeader>
                <AddPodcastForm onSuccess={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        ) : allEpisodes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No episodes found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allEpisodes.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
        )}
      </div>
    </ContentWrapper>
  )
}
