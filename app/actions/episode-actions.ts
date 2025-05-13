"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

export async function updateEpisodeProgressAction(
  userId: string,
  episodeId: string,
  progress: number,
  played: boolean,
) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if user_episode record exists
    const { data: existingUserEpisode, error: checkError } = await supabase
      .from("user_episodes")
      .select("*")
      .eq("user_id", userId)
      .eq("episode_id", episodeId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking user episode:", checkError)
      return { success: false, error: checkError.message }
    }

    if (existingUserEpisode) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("user_episodes")
        .update({
          progress: progress,
          played: played,
          last_played: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("episode_id", episodeId)

      if (updateError) {
        console.error("Error updating user episode:", updateError)
        return { success: false, error: updateError.message }
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase.from("user_episodes").insert({
        user_id: userId,
        episode_id: episodeId,
        progress: progress,
        played: played,
        last_played: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error inserting user episode:", insertError)
        return { success: false, error: insertError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in updateEpisodeProgressAction:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
