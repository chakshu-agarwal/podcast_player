"use client"

import { usePodcast, type Podcast } from "@/context/podcast-context"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PodcastCardProps {
  podcast: Podcast
}

export function PodcastCard({ podcast }: PodcastCardProps) {
  const { removePodcast } = usePodcast()

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Link href={`/podcasts/${podcast.id}`}>
          <div className="relative aspect-square w-full">
            <Image
              src={podcast.imageUrl || "/placeholder.svg?height=300&width=300"}
              alt={podcast.title}
              fill
              className="object-cover"
            />
          </div>
        </Link>

        <div className="p-3">
          <div className="flex items-start justify-between">
            <Link href={`/podcasts/${podcast.id}`} className="flex-1">
              <h3 className="font-medium line-clamp-1">{podcast.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{podcast.author}</p>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => removePodcast(podcast.id)}>Remove</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-xs text-muted-foreground mt-2">{podcast.episodes.length} episodes</p>
        </div>
      </CardContent>
    </Card>
  )
}
