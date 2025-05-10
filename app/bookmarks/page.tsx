"use client"

import { usePodcast, type Bookmark } from "@/context/podcast-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pencil, Trash2, Loader2 } from "lucide-react"
import Image from "next/image"
import { formatTime } from "@/lib/utils"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/auth/protected-route"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function BookmarksPage() {
  const { bookmarks, podcasts, playFromTimestamp, editBookmark, deleteBookmark, isLoading } = usePodcast()
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [editNote, setEditNote] = useState("")

  // Group bookmarks by episode
  const bookmarksByEpisode = bookmarks.reduce<Record<string, Bookmark[]>>((acc, bookmark) => {
    if (!acc[bookmark.episodeId]) {
      acc[bookmark.episodeId] = []
    }
    acc[bookmark.episodeId].push(bookmark)
    return acc
  }, {})

  // Find episode details for each group
  const episodeGroups = Object.entries(bookmarksByEpisode)
    .map(([episodeId, bookmarks]) => {
      let episode = null

      // Find the episode in podcasts
      for (const podcast of podcasts) {
        const foundEpisode = podcast.episodes.find((ep) => ep.id === episodeId)
        if (foundEpisode) {
          episode = foundEpisode
          break
        }
      }

      return {
        episodeId,
        episode,
        bookmarks: bookmarks.sort((a, b) => a.timestamp - b.timestamp),
      }
    })
    .filter((group) => group.episode !== null)

  const handlePlayFromBookmark = (bookmark: Bookmark) => {
    const episode = episodeGroups.find((group) => group.episodeId === bookmark.episodeId)?.episode
    if (episode) {
      playFromTimestamp(episode, bookmark.timestamp)
    }
  }

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setEditNote(bookmark.note || "")
  }

  const saveEditedBookmark = () => {
    if (editingBookmark) {
      editBookmark(editingBookmark.id, editNote)
      setEditingBookmark(null)
      setEditNote("")
    }
  }

  const handleDeleteBookmark = (bookmarkId: string) => {
    deleteBookmark(bookmarkId)
  }

  return (
    <ProtectedRoute>
      <div className="py-6 space-y-6">
        <h1 className="text-2xl font-bold">Bookmarks</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : episodeGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No Bookmarks Yet</h2>
            <p className="text-muted-foreground">
              Add bookmarks while listening to episodes by clicking the bookmark icon in the player.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {episodeGroups.map(({ episodeId, episode, bookmarks }) => (
              <Card key={episodeId} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={episode?.imageUrl || "/placeholder.svg?height=48&width=48"}
                        alt={episode?.title || "Episode"}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <CardTitle className="text-lg">{episode?.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookmarks.map((bookmark) => (
                      <div key={bookmark.id} className="border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => handlePlayFromBookmark(bookmark)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {formatTime(bookmark.timestamp)}
                            </Button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditBookmark(bookmark)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Bookmark</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this bookmark? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteBookmark(bookmark.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        {bookmark.note && <div className="mt-2 text-sm text-muted-foreground">{bookmark.note}</div>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Bookmark Dialog */}
        <Dialog open={editingBookmark !== null} onOpenChange={(open) => !open && setEditingBookmark(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Bookmark Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bookmark-note">Note</Label>
                <Textarea
                  id="edit-bookmark-note"
                  placeholder="Add a note about this bookmark..."
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBookmark(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedBookmark}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
