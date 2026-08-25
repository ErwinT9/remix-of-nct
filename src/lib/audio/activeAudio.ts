/**
 * App-wide guard so only one audio element can ever play at a time.
 * Any player registers its element before starting playback; the previously
 * active element is paused and released first.
 */
let active: HTMLAudioElement | null = null;

export function claimAudio(audio: HTMLAudioElement): void {
  if (active && active !== audio) {
    try {
      active.pause();
    } catch {
      /* element already torn down */
    }
  }
  active = audio;
}

export function releaseAudio(audio: HTMLAudioElement): void {
  if (active === audio) active = null;
}
