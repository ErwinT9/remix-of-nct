import {
  CloudRain,
  Compass,
  Feather,
  Flower2,
  HandHeart,
  Heart,
  HeartHandshake,
  Leaf,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Sunrise,
  Waves,
  Wind,
  Wine,
  type LucideIcon,
} from "lucide-react";

export type HealingAudioTrack = {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Exact cloud URL — audio is streamed, never bundled. */
  src: string;
};

export type HealingAudioCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tint: string;
  /** Categories that reuse an existing screen navigate there instead. */
  route?: "/motivation/meditation" | "/motivation/alcohol-control";
  tracks?: HealingAudioTrack[];
};

const BASE = "https://vexalabs.biz/audio";

export const HEALING_AUDIO_TAGLINE = "Listen, relax, heal and strengthen your journey.";

export const HEALING_AUDIO_CATEGORIES: HealingAudioCategory[] = [
  {
    id: "calm-reset",
    title: "Calm & Reset",
    subtitle: "Find calm when emotions feel overwhelming.",
    icon: Wind,
    tint: "bg-sky",
    tracks: [
      {
        id: "when-you-miss-them",
        title: "When You Miss Them",
        subtitle: "Sit with the missing without acting on it.",
        icon: Heart,
        src: `${BASE}/when-you-miss-them.m4a`,
      },
      {
        id: "pause-before-you-reach-out",
        title: "Pause Before You Reach Out",
        subtitle: "A few minutes between the urge and the message.",
        icon: HandHeart,
        src: `${BASE}/pause-before-you-reach-out.m4a`,
      },
      {
        id: "calm-your-racing-thoughts",
        title: "Calm Your Racing Thoughts",
        subtitle: "Slow the spiral and come back to now.",
        icon: CloudRain,
        src: `${BASE}/calm-your-racing-thoughts.m4a`,
      },
      {
        id: "the-wave-will-pass",
        title: "The Wave Will Pass",
        subtitle: "Ride the feeling until it softens.",
        icon: Waves,
        src: `${BASE}/the-wave-will-pass.m4a`,
      },
    ],
  },
  {
    id: "no-contact-strength",
    title: "No Contact Motivation & Strength",
    subtitle: "Stay strong and protect the progress you have made.",
    icon: Shield,
    tint: "bg-mint",
    tracks: [
      {
        id: "why-you-started-no-contact",
        title: "Why You Started No Contact",
        subtitle: "Remember the reason behind the boundary.",
        icon: Compass,
        src: `${BASE}/why-you-started-no-contact.m4a`,
      },
      {
        id: "dont-break-your-progress",
        title: "Don't Break Your Progress",
        subtitle: "Everything you've built is worth keeping.",
        icon: Shield,
        src: `${BASE}/dont-break-your-progress.m4a`,
      },
      {
        id: "choose-yourself-today",
        title: "Choose Yourself Today",
        subtitle: "Put your own healing first, one more time.",
        icon: HeartHandshake,
        src: `${BASE}/choose-yourself-today.m4a`,
      },
      {
        id: "one-more-day",
        title: "One More Day",
        subtitle: "You only ever need to get through today.",
        icon: Sunrise,
        src: `${BASE}/one-more-day.m4a`,
      },
    ],
  },
  {
    id: "healing-growth",
    title: "Healing, Growth & Moving Forward",
    subtitle: "Reconnect with yourself and move forward with strength.",
    icon: Leaf,
    tint: "bg-blush",
    tracks: [
      {
        id: "you-are-still-you",
        title: "You Are Still You",
        subtitle: "Nothing you lost took your worth with it.",
        icon: Sun,
        src: `${BASE}/you-are-still-you.m4a`,
      },
      {
        id: "letting-go-without-forgetting",
        title: "Letting Go Without Forgetting",
        subtitle: "Release the grip while keeping the lesson.",
        icon: Feather,
        src: `${BASE}/letting-go-without-forgetting.m4a`,
      },
      {
        id: "your-future-self",
        title: "Your Future Self",
        subtitle: "Meet the version of you this is building.",
        icon: Moon,
        src: `${BASE}/your-future-self.m4a`,
      },
      {
        id: "celebrate-your-progress",
        title: "Celebrate Your Progress",
        subtitle: "Notice how far you have already come.",
        icon: Sparkles,
        src: `${BASE}/celebrate-your-progress.m4a`,
      },
    ],
  },
  {
    id: "mindful-meditation",
    title: "Mindful Meditation",
    subtitle: "Relax, breathe and find your calm.",
    icon: Flower2,
    tint: "bg-lavender",
    route: "/motivation/meditation",
  },
  {
    id: "alcohol-control",
    title: "Alcohol Control",
    subtitle: "Stay grounded and take control of the moment.",
    icon: Wine,
    tint: "bg-sand",
    route: "/motivation/alcohol-control",
  },
];

export function findHealingCategory(id: string): HealingAudioCategory | undefined {
  return HEALING_AUDIO_CATEGORIES.find((category) => category.id === id);
}
