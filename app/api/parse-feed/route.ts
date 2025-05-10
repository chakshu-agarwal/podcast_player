import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { XMLParser } from "fast-xml-parser"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export async function GET(request: NextRequest) {
  // Create a new cookie store for each request
  const cookieStore = cookies()

  // Create the Supabase client with the cookie store
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  })

  // Check if user is authenticated
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("Session error:", sessionError)
    return NextResponse.json({ error: "Authentication error" }, { status: 401 })
  }

  if (!session) {
    console.error("No session found")
    return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
  }

  //console.log("Authenticated user:", session.user.id)

  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    console.log(`Fetching podcast feed from: ${url}`)

    // Improved fetch with better error handling and timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, */*",
        "User-Agent": "Podcast-Player/1.0",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Failed to fetch feed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        {
          error: `Failed to fetch feed: ${response.status} ${response.statusText}`,
        },
        { status: 500 },
      )
    }

    const xml = await response.text()

    if (!xml || xml.trim() === "") {
      console.error("Empty response received from feed")
      return NextResponse.json({ error: "Empty feed response" }, { status: 400 })
    }

    // More robust XML parsing with error handling
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      isArray: (name) => name === "item", // Always treat item as array
      parseAttributeValue: true,
      trimValues: true,
    })

    let result
    try {
      result = parser.parse(xml)
    } catch (parseError) {
      console.error("XML parsing error:", parseError)
      return NextResponse.json({ error: "Invalid XML format" }, { status: 400 })
    }

    const channel = result.rss?.channel

    if (!channel) {
      console.error("Invalid RSS feed format - no channel found")
      return NextResponse.json({ error: "Invalid RSS feed format - no channel found" }, { status: 400 })
    }

    // Extract podcast info with better fallbacks
    const podcast = {
      id: uuidv4(),
      title: channel.title || "Unknown Podcast",
      description: channel.description || "",
      imageUrl:
        channel.image?.url ||
        channel["itunes:image"]?.["@_href"] ||
        channel.image?.["@_href"] ||
        "/placeholder.svg?height=300&width=300",
      author: channel["itunes:author"] || channel.author || channel.managingEditor || "Unknown Author",
      feedUrl: url,
      episodes: [],
    }

    // Ensure items is always an array
    const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : []

    podcast.episodes = items
      .map((item) => {
        // Handle different enclosure formats
        const enclosure = item.enclosure || {}
        const audioUrl = enclosure["@_url"] || (Array.isArray(enclosure) && enclosure[0]?.["@_url"]) || item.link || ""

        // Skip if no audio URL
        if (!audioUrl) return null

        return {
          id: uuidv4(),
          title: item.title || "Untitled Episode",
          description: item.description || item["itunes:summary"] || "",
          audioUrl: audioUrl,
          imageUrl: item["itunes:image"]?.["@_href"] || podcast.imageUrl,
          pubDate: item.pubDate || item.pubdate || "",
          duration: item["itunes:duration"] || "",
          podcastId: podcast.id,
          podcastTitle: podcast.title,
          played: false,
          progress: 0,
        }
      })
      .filter((episode) => episode !== null) // Remove null episodes

    if (podcast.episodes.length === 0) {
      console.warn("No episodes with audio URLs found in feed")
    }

    return NextResponse.json(podcast)
  } catch (error) {
    console.error("Error parsing feed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: `Failed to parse feed: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
