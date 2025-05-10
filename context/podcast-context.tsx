"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useAuth } from "@/context/auth-context"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { v4 as uuidv4 } from "uuid"
import { AUDIO_PAUSE_EVENT } from "@/lib/events"
import type { Database } from "@/types/supabase"

export type Bookmark = {
  id: string
  episodeId: string
  timestamp: number // in seconds
  note?: string
  createdAt: number // timestamp
}

export type Episode = {
  id: string
  title: string
  description: string
  audioUrl: string
  imageUrl: string
  pubDate: string
  duration: string
  podcastId: string
  podcastTitle: string
  played: boolean
  progress: number
  lastPlayed?: number // Timestamp when last played
}

export type Podcast = {
  id: string
  title: string
  description: string
  imageUrl: string
  author: string
  feedUrl: string
  episodes: Episode[]
}

type PodcastContextType = {
  podcasts: Podcast[]
  currentEpisode: Episode | null
  isPlaying: boolean
  volume: number
  progress: number
  history: Episode[]
  bookmarks: Bookmark[]
  playbackSpeed: number
  currentTime: number
  isLoading: boolean
  addPodcast: (feedUrl: string) => Promise<void>
  removePodcast: (id: string) => void
  playEpisode: (episode: Episode) => void
  playFromTimestamp: (episode: Episode, timestamp: number) => void
  pauseEpisode: () => void
  setProgress: (progress: number) => void
  setVolume: (volume: number) => void
  setPlaybackSpeed: (speed: number) => void
  addBookmark: (note?: string, timestamp?: number) => void
  editBookmark: (id: string, note: string) => void
  deleteBookmark: (id: string) => void
  skipForward: () => void
  skipBackward: () => void
  clearAllData: () => void
  updateEpisodeProgress: (episode: Episode, progress: number) => void
}

const PodcastContext = createContext<PodcastContextType | undefined>(undefined)

export function PodcastProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const supabase = useSupabaseClient<Database>()

  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [history, setHistory] = useState<Episode[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)

  // Use useRef to maintain a single audio instance
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Track if we need to start playing when audio is loaded
  const shouldPlayRef = useRef(false)

  // Track if we're playing from a bookmark
  const playingFromBookmarkRef = useRef(false)

  // Ref to store the last time the progress was updated
  const lastProgressUpdateRef = useRef<number | null>(null)

  // Track the last loaded user ID to prevent duplicate loading
  const lastLoadedUserIdRef = useRef<string | null>(null)

  // Listen for the audio pause event
  useEffect(() => {
    // Listen for the audio pause event
    const handleAudioPause = () => {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }

    window.addEventListener(AUDIO_PAUSE_EVENT, handleAudioPause)

    // Clean up event listener
    return () => {
      window.removeEventListener(AUDIO_PAUSE_EVENT, handleAudioPause)
    }
  }, [isPlaying])

  // Load data from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setPodcasts([])
      setHistory([])
      setBookmarks([])
      setIsLoading(false)
      lastLoadedUserIdRef.current = null
      return
    }

    // Skip loading if we've already loaded data for this user
    if (lastLoadedUserIdRef.current === user.id && podcasts.length > 0) {
      return
    }

    const loadUserData = async () => {
      setIsLoading(true)
      //console.log("Loading data for user:", user.id)

      try {
        // Load podcasts
        const { data: podcastsData, error: podcastsError } = await supabase
          .from("podcasts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (podcastsError) {
          console.error("Error loading podcasts:", podcastsError)
          throw podcastsError
        }

        //console.log(`Loaded ${podcastsData.length} podcasts`)

        // Load episodes for each podcast
        const loadedPodcasts: Podcast[] = []

        for (const podcast of podcastsData) {
          const { data: episodesData, error: episodesError } = await supabase
            .from("episodes")
            .select("*")
            .eq("podcast_id", podcast.id)
            .order("pub_date", { ascending: false })

          if (episodesError) {
            console.error("Error loading episodes:", episodesError)
            throw episodesError
          }

          const episodes: Episode[] = episodesData.map((ep) => ({
            id: ep.id,
            title: ep.title,
            description: ep.description || "",
            audioUrl: ep.audio_url,
            imageUrl: ep.image_url || podcast.image_url || "",
            pubDate: ep.pub_date || "",
            duration: ep.duration || "",
            podcastId: podcast.id,
            podcastTitle: podcast.title,
            played: ep.played || false,
            progress: ep.progress || 0,
            lastPlayed: ep.last_played ? new Date(ep.last_played).getTime() : undefined,
          }))

          loadedPodcasts.push({
            id: podcast.id,
            title: podcast.title,
            description: podcast.description || "",
            imageUrl: podcast.image_url || "",
            author: podcast.author || "",
            feedUrl: podcast.feed_url,
            episodes,
          })
        }

        setPodcasts(loadedPodcasts)

        // Load bookmarks
        const { data: bookmarksData, error: bookmarksError } = await supabase
          .from("bookmarks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (bookmarksError) {
          console.error("Error loading bookmarks:", bookmarksError)
          throw bookmarksError
        }

        //console.log(`Loaded ${bookmarksData.length} bookmarks`)

        const formattedBookmarks: Bookmark[] = bookmarksData.map((bm) => ({
          id: bm.id,
          episodeId: bm.episode_id,
          timestamp: bm.timestamp,
          note: bm.note || undefined,
          createdAt: new Date(bm.created_at || Date.now()).getTime(),
        }))

        setBookmarks(formattedBookmarks)

        // Create history from episodes with progress
        const historyEpisodes: Episode[] = []
        loadedPodcasts.forEach((podcast) => {
          podcast.episodes.forEach((episode) => {
            if (episode.progress > 0 || episode.played) {
              historyEpisodes.push(episode)
            }
          })
        })

        // Sort by last played
        historyEpisodes.sort((a, b) => {
          const timeA = a.lastPlayed || 0
          const timeB = b.lastPlayed || 0
          return timeB - timeA
        })

        setHistory(historyEpisodes)
        //console.log(`Loaded ${historyEpisodes.length} history items`)

        // Load playback speed from localStorage (this is user preference, not stored in DB)
        if (typeof window !== "undefined") {
          const savedPlaybackSpeed = localStorage.getItem("playbackSpeed")
          if (savedPlaybackSpeed) {
            setPlaybackSpeed(Number.parseFloat(savedPlaybackSpeed))
          }
        }

        // Update the last loaded user ID
        lastLoadedUserIdRef.current = user.id
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [user, supabase])

  // Save playback speed to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("playbackSpeed", playbackSpeed.toString())
    }
  }, [playbackSpeed])

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Handle play/pause state changes
  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      shouldPlayRef.current = true
      const playPromise = audioRef.current.play()

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Error playing audio:", error)
          setIsPlaying(false)
          shouldPlayRef.current = false
        })
      }
    } else {
      audioRef.current.pause()
      shouldPlayRef.current = false

      // When pausing, update the episode's progress in the podcasts state
      // Only update if not playing from a bookmark
      if (currentEpisode && audioRef.current && !playingFromBookmarkRef.current) {
        updateEpisodeProgress(currentEpisode, audioRef.current.currentTime / (audioRef.current.duration || 1))
      }
    }
  }, [isPlaying, currentEpisode])

  // Handle episode changes
  useEffect(() => {
    // Save current progress before changing episodes
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
      const currentProgress = audioRef.current.currentTime / audioRef.current.duration

      // Only update if not playing from a bookmark
      if (currentEpisode && !playingFromBookmarkRef.current) {
        updateEpisodeProgress(currentEpisode, currentProgress)
      }

      // Stop current playback
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current.load()
    }

    // Clean up previous audio element
    if (audioRef.current) {
      audioRef.current.onloadedmetadata = null
      audioRef.current.ontimeupdate = null
      audioRef.current.onended = null
    }

    // Create new audio element if we have an episode
    if (currentEpisode) {
      // Create new audio element or reuse existing
      if (!audioRef.current) {
        audioRef.current = new Audio()
      }

      audioRef.current.src = currentEpisode.audioUrl
      audioRef.current.volume = volume
      audioRef.current.playbackRate = playbackSpeed

      // Find the episode in our podcasts to get the saved progress
      const savedEpisode = findEpisodeInPodcasts(currentEpisode.id)
      const startProgress = savedEpisode?.progress || 0

      // Set up event listeners
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
          // If playing from bookmark, set the time directly
          if (playingFromBookmarkRef.current && audioRef.current.duration > 0) {
            // Do nothing, the timestamp will be set in the playFromTimestamp function
          }
          // Otherwise resume from last position
          else if (startProgress > 0) {
            audioRef.current.currentTime = startProgress * audioRef.current.duration
          }

          // Start playing if needed
          if (shouldPlayRef.current && audioRef.current) {
            audioRef.current.play().catch((err) => {
              console.error("Error playing audio:", err)
              setIsPlaying(false)
              shouldPlayRef.current = false
            })
          }
        }
      }

      audioRef.current.ontimeupdate = () => {
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
          const currentProgress = audioRef.current.currentTime / audioRef.current.duration
          setProgress(currentProgress)
          setCurrentTime(audioRef.current.currentTime)

          // Only update history if not playing from a bookmark
          // Update more frequently - every 2 seconds instead of only when paused
          if (audioRef.current.currentTime > 0 && currentEpisode && !playingFromBookmarkRef.current) {
            // Use a debounce-like approach to avoid too many updates
            const now = Date.now()
            if (!lastProgressUpdateRef.current || now - lastProgressUpdateRef.current > 2000) {
              updateHistory(currentEpisode, currentProgress)
              updateEpisodeProgress(currentEpisode, currentProgress)
              lastProgressUpdateRef.current = now
            }
          }
        }
      }

      audioRef.current.onended = () => {
        setIsPlaying(false)
        shouldPlayRef.current = false
        setProgress(0)

        // Reset the playing from bookmark flag
        playingFromBookmarkRef.current = false

        // Update episode progress to 1 (completed)
        if (currentEpisode) {
          updateEpisodeProgress(currentEpisode, 1)
        }
      }

      // Load the audio
      audioRef.current.load()

      // Mark as played immediately when selected
      if (currentEpisode && !playingFromBookmarkRef.current) {
        markEpisodeAsPlayed(currentEpisode)
      }
    }
  }, [currentEpisode])

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Update playback speed when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

  // Helper to find an episode in the podcasts array
  const findEpisodeInPodcasts = (episodeId: string) => {
    for (const podcast of podcasts) {
      const episode = podcast.episodes.find((ep) => ep.id === episodeId)
      if (episode) return episode
    }
    return null
  }

  // Update episode progress in podcasts state and Supabase
  const updateEpisodeProgress = async (episode: Episode, progress: number) => {
    if (!user) return

    // Round to 2 decimal places for more precise progress tracking
    const roundedProgress = Math.round(progress * 100) / 100

    // Update local state
    setPodcasts((prevPodcasts) =>
      prevPodcasts.map((podcast) => ({
        ...podcast,
        episodes: podcast.episodes.map((ep) => {
          if (ep.id === episode.id) {
            return {
              ...ep,
              progress: roundedProgress,
              played: true,
              lastPlayed: Date.now(),
            }
          }
          return ep
        }),
      })),
    )

    // Update in Supabase
    try {
      await supabase
        .from("episodes")
        .update({
          progress: roundedProgress,
          played: true,
          last_played: new Date().toISOString(),
        })
        .eq("id", episode.id)
    } catch (error) {
      console.error("Error updating episode progress:", error)
    }
  }

  // Mark episode as played
  const markEpisodeAsPlayed = async (episode: Episode) => {
    if (!user) return

    // Update local state
    setPodcasts((prevPodcasts) =>
      prevPodcasts.map((podcast) => ({
        ...podcast,
        episodes: podcast.episodes.map((ep) => {
          if (ep.id === episode.id && !ep.played) {
            return {
              ...ep,
              played: true,
              lastPlayed: Date.now(),
            }
          }
          return ep
        }),
      })),
    )

    // Update in Supabase
    try {
      await supabase
        .from("episodes")
        .update({
          played: true,
          last_played: new Date().toISOString(),
        })
        .eq("id", episode.id)
    } catch (error) {
      console.error("Error marking episode as played:", error)
    }
  }

  // Update history with the latest episode progress
  const updateHistory = (episode: Episode, currentProgress: number) => {
    // Round to 2 decimal places for more precise progress tracking
    const roundedProgress = Math.round(currentProgress * 100) / 100

    const updatedEpisode = {
      ...episode,
      progress: roundedProgress,
      played: true,
      lastPlayed: Date.now(),
    }

    setHistory((prevHistory) => {
      // Check if episode already exists in history
      const existingIndex = prevHistory.findIndex((ep) => ep.id === episode.id)

      if (existingIndex !== -1) {
        // Update existing episode in history
        const updatedHistory = [...prevHistory]
        updatedHistory[existingIndex] = {
          ...updatedHistory[existingIndex],
          progress: roundedProgress,
          lastPlayed: Date.now(),
        }

        // Sort by lastPlayed (most recent first)
        return updatedHistory.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
      } else {
        // Add new episode to history
        return [updatedEpisode, ...prevHistory]
      }
    })
  }

  // Parse RSS feed and add podcast
  const addPodcast = async (feedUrl: string) => {
    if (!user) throw new Error("You must be logged in to add podcasts")

    try {
      // First, check if podcast already exists for this user
      const { data: existingPodcasts } = await supabase
        .from("podcasts")
        .select("*")
        .eq("feed_url", feedUrl)
        .eq("user_id", user.id)

      if (existingPodcasts && existingPodcasts.length > 0) {
        throw new Error("Podcast already exists in your library")
      }

      // Fetch podcast data from API with better error handling
      const response = await fetch(`/api/parse-feed?url=${encodeURIComponent(feedUrl)}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Server responded with status: ${response.status}`
        throw new Error(errorMessage)
      }

      const podcastData = await response.json()

      if (!podcastData || !podcastData.title) {
        throw new Error("Invalid podcast data received")
      }

      // Generate a UUID for the podcast
      const podcastId = uuidv4()

      // Insert podcast into Supabase
      await supabase.from("podcasts").insert({
        id: podcastId,
        title: podcastData.title,
        description: podcastData.description,
        image_url: podcastData.imageUrl,
        author: podcastData.author,
        feed_url: feedUrl,
        user_id: user.id,
      })

      // Insert episodes into Supabase
      const episodesToInsert = podcastData.episodes.map((episode: any) => ({
        id: episode.id,
        title: episode.title,
        description: episode.description,
        audio_url: episode.audioUrl,
        image_url: episode.imageUrl,
        pub_date: episode.pubDate,
        duration: episode.duration,
        podcast_id: podcastId,
        played: false,
        progress: 0,
      }))

      if (episodesToInsert.length > 0) {
        await supabase.from("episodes").insert(episodesToInsert)
      }

      // Update local state
      const formattedEpisodes: Episode[] = podcastData.episodes.map((episode: any) => ({
        id: episode.id,
        title: episode.title,
        description: episode.description,
        audioUrl: episode.audioUrl,
        imageUrl: episode.imageUrl,
        pubDate: episode.pubDate,
        duration: episode.duration,
        podcastId: podcastId,
        podcastTitle: podcastData.title,
        played: false,
        progress: 0,
      }))

      const newPodcast: Podcast = {
        id: podcastId,
        title: podcastData.title,
        description: podcastData.description,
        imageUrl: podcastData.imageUrl,
        author: podcastData.author,
        feedUrl: feedUrl,
        episodes: formattedEpisodes,
      }

      setPodcasts((prev) => [newPodcast, ...prev])
      return
    } catch (error) {
      console.error("Error adding podcast:", error)
      throw error
    }
  }

  const removePodcast = async (id: string) => {
    if (!user) return

    try {
      // Delete from Supabase (cascade will delete episodes)
      await supabase.from("podcasts").delete().eq("id", id).eq("user_id", user.id)

      // Update local state
      setPodcasts((prev) => prev.filter((podcast) => podcast.id !== id))

      // Update history to remove episodes from this podcast
      setHistory((prev) => prev.filter((episode) => episode.podcastId !== id))
    } catch (error) {
      console.error("Error removing podcast:", error)
    }
  }

  const playEpisode = (episode: Episode) => {
    // If we're already playing this episode, do nothing
    if (isPlaying && currentEpisode?.id === episode.id) {
      return
    }

    // If we're playing a different episode, stop it first
    if (isPlaying) {
      pauseEpisode()
    }

    // Reset the playing from bookmark flag
    playingFromBookmarkRef.current = false

    // Set the new episode and mark that we want to play
    setCurrentEpisode(episode)
    shouldPlayRef.current = true
    setIsPlaying(true)
  }

  const playFromTimestamp = (episode: Episode, timestamp: number) => {
    // If we're playing a different episode, stop it first
    if (isPlaying) {
      pauseEpisode()
    }

    // Set the playing from bookmark flag
    playingFromBookmarkRef.current = true

    // Set the new episode
    setCurrentEpisode(episode)

    // Set up a callback to set the timestamp after the audio is loaded
    const setTimestampAfterLoad = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = timestamp
        audioRef.current.play().catch((err) => {
          console.error("Error playing from timestamp:", err)
          setIsPlaying(false)
        })

        // Remove the event listener to avoid multiple calls
        audioRef.current.removeEventListener("loadedmetadata", setTimestampAfterLoad)
      }
    }

    // If audio is already loaded, set the timestamp directly
    if (audioRef.current && audioRef.current.readyState >= 2) {
      audioRef.current.currentTime = timestamp
      audioRef.current.play().catch((err) => {
        console.error("Error playing from timestamp:", err)
        setIsPlaying(false)
      })
    } else if (audioRef.current) {
      // Otherwise, wait for the audio to load
      audioRef.current.addEventListener("loadedmetadata", setTimestampAfterLoad)
    }

    setIsPlaying(true)
  }

  const pauseEpisode = () => {
    setIsPlaying(false)
  }

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 30 // Skip forward 30 seconds
    }
  }

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 15 // Skip backward 15 seconds
    }
  }

  const updateProgress = (newProgress: number) => {
    setProgress(newProgress)
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      audioRef.current.currentTime = newProgress * audioRef.current.duration
    }
  }

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume)
  }

  const updatePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed)
  }

  // Bookmark functions
  const addBookmark = async (note?: string, timestamp?: number) => {
    if (!currentEpisode || !audioRef.current || !user) return

    // Use the provided timestamp if available, otherwise use the current time
    const bookmarkTimestamp = timestamp !== undefined ? timestamp : audioRef.current.currentTime

    const bookmarkId = uuidv4()
    const newBookmark: Bookmark = {
      id: bookmarkId,
      episodeId: currentEpisode.id,
      timestamp: bookmarkTimestamp,
      note,
      createdAt: Date.now(),
    }

    // Add to local state
    setBookmarks((prev) => [newBookmark, ...prev])

    // Add to Supabase
    try {
      await supabase.from("bookmarks").insert({
        id: bookmarkId,
        episode_id: currentEpisode.id,
        timestamp: bookmarkTimestamp,
        note: note || null,
        user_id: user.id,
      })
    } catch (error) {
      console.error("Error adding bookmark:", error)
    }
  }

  const editBookmark = async (id: string, note: string) => {
    if (!user) return

    // Update local state
    setBookmarks((prev) => prev.map((bookmark) => (bookmark.id === id ? { ...bookmark, note } : bookmark)))

    // Update in Supabase
    try {
      await supabase.from("bookmarks").update({ note }).eq("id", id).eq("user_id", user.id)
    } catch (error) {
      console.error("Error updating bookmark:", error)
    }
  }

  const deleteBookmark = async (id: string) => {
    if (!user) return

    // Update local state
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))

    // Delete from Supabase
    try {
      await supabase.from("bookmarks").delete().eq("id", id).eq("user_id", user.id)
    } catch (error) {
      console.error("Error deleting bookmark:", error)
    }
  }

  const clearAllData = async () => {
    if (!user) return

    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }

    try {
      // Delete all user data from Supabase
      await supabase.from("podcasts").delete().eq("user_id", user.id)

      // Clear all state
      setPodcasts([])
      setCurrentEpisode(null)
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
      setHistory([])
      setBookmarks([])
    } catch (error) {
      console.error("Error clearing user data:", error)
    }
  }

  return (
    <PodcastContext.Provider
      value={{
        podcasts,
        currentEpisode,
        isPlaying,
        volume,
        progress,
        currentTime,
        history,
        bookmarks,
        playbackSpeed,
        isLoading,
        addPodcast,
        removePodcast,
        playEpisode,
        playFromTimestamp,
        pauseEpisode,
        setProgress: updateProgress,
        setVolume: updateVolume,
        setPlaybackSpeed: updatePlaybackSpeed,
        addBookmark,
        editBookmark,
        deleteBookmark,
        skipForward,
        skipBackward,
        clearAllData,
        updateEpisodeProgress,
      }}
    >
      {children}
    </PodcastContext.Provider>
  )
}

export function usePodcast() {
  const context = useContext(PodcastContext)
  if (context === undefined) {
    throw new Error("usePodcast must be used within a PodcastProvider")
  }
  return context
}
