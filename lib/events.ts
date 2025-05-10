// Custom event for pausing audio playback
export const AUDIO_PAUSE_EVENT = "podcast-player:pause-audio"

// Create a custom event for pausing audio
export function createAudioPauseEvent(): Event {
  return new Event(AUDIO_PAUSE_EVENT)
}
