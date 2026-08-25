export type MeditationTrack = {
  id: "calm" | "peace" | "rain" | "wave";
  label: string;
  src: string;
};

/**
 * Meditation audio is streamed from the cloud (never bundled with the app), so
 * the feature requires an internet connection just like the other Healing Audio
 * sessions. To swap a recording, change the URL here only.
 */
export const MEDITATION_TRACKS: MeditationTrack[] = [
  { id: "calm", label: "Calm", src: "https://vexalabs.biz/audio/calm.m4a" },
  { id: "peace", label: "Peace", src: "https://vexalabs.biz/audio/peace.m4a" },
  { id: "rain", label: "Rain", src: "https://vexalabs.biz/audio/rain.m4a" },
  { id: "wave", label: "Wave", src: "https://vexalabs.biz/audio/wave.m4a" },
];

export function formatClock(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
