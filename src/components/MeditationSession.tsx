import { CloudAudioSession, type CloudAudioTrack } from "@/components/CloudAudioSession";

/**
 * Meditation player used by the standalone Mindful Meditation screen and by the
 * Journey activity. It is a thin wrapper over the shared cloud audio session so
 * there is only ever one audio playback implementation.
 */
export function MeditationSession({
  track,
  onExit,
  onComplete,
  completionTitle = "Meditation Complete",
  completionMessage,
  doneLabel = "Done",
}: {
  track: CloudAudioTrack;
  onExit: () => void;
  /** Fired once when the audio session finishes playing. */
  onComplete?: () => void;
  completionTitle?: string;
  completionMessage?: string;
  doneLabel?: string;
}) {
  return (
    <CloudAudioSession
      track={track}
      screenTitle="Mindful Meditation"
      onExit={onExit}
      onComplete={onComplete}
      completionTitle={completionTitle}
      completionMessage={completionMessage}
      doneLabel={doneLabel}
    />
  );
}
