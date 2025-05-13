"use client"

import { usePodcast } from "@/context/podcast-context"
import { useAuth } from "@/context/auth-context"
import { EpisodeCard } from "@/components/episode-card"
import { AddPodcastForm } from "@/components/add-podcast-form"
import { Button } from "@/components/ui/button"
import { PlusCircle, LogIn, Loader2 } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { ContentWrapper } from "@/components/layout/content-wrapper"
import { SearchInput } from "@/components/search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDebounce } from "@/hooks/use-debounce"

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const { podcasts, isLoading: podcastsLoading } = usePodcast()
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPodcast, setSelectedPodcast] = useState<string>("all")
  const [isSearching, setIsSearching] = useState(false)

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const isLoading = authLoading || podcastsLoading

  // Get all episodes from all podcasts and sort by publication date
  const allEpisodes = useMemo(() => {
    return podcasts
      .flatMap((podcast) => podcast.episodes)
      .sort((a, b) => {
        const dateA = new Date(a.pubDate).getTime()
        const dateB = new Date(b.pubDate).getTime()
        return dateB - dateA // Sort in descending order (newest first)
      })
  }, [podcasts])

  // Set searching state when search term changes
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true)
    }
  }, [searchTerm, debouncedSearchTerm])

  // Filter episodes based on search term and selected podcast
  const filteredEpisodes = useMemo(() => {
    if (!debouncedSearchTerm && selectedPodcast === "all") {
      setIsSearching(false)
      return allEpisodes
    }

    const filtered = allEpisodes.filter((episode) => {
      // Filter by podcast if selected
      if (selectedPodcast !== "all" && episode.podcastId !== selectedPodcast) {
        return false
      }

      // Filter by search term if provided
      if (debouncedSearchTerm) {
        const searchTermLower = debouncedSearchTerm.toLowerCase()
        return (
          episode.title.toLowerCase().includes(searchTermLower) ||
          episode.description.toLowerCase().includes(searchTermLower)
        )
      }

      return true
    })

    // Set searching to false after filtering is complete
    setIsSearching(false)
    return filtered
  }, [allEpisodes, debouncedSearchTerm, selectedPodcast])

  // Reset search state when component unmounts
  useEffect(() => {
    return () => {
      setIsSearching(false)
    }
  }, [])

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
        ) : (
          <>
            <div className="space-y-4">
              {/* Search and filter controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search episodes..."
                  className="flex-1"
                  isLoading={isSearching}
                />

                <Select value={selectedPodcast} onValueChange={setSelectedPodcast}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by podcast" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Podcasts</SelectItem>
                    {podcasts.map((podcast) => (
                      <SelectItem key={podcast.id} value={podcast.id}>
                        {podcast.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search results with improved loading state */}
              {filteredEpisodes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {isSearching ? "Searching..." : "No episodes found matching your search"}
                  </p>
                  {searchTerm && !isSearching && (
                    <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2">
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {isSearching && (
                    <div className="py-2 px-4 bg-muted/30 rounded-md flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                      <span className="text-sm">Updating results...</span>
                    </div>
                  )}
                  {filteredEpisodes.map((episode) => (
                    <EpisodeCard key={episode.id} episode={episode} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ContentWrapper>
  )
}
