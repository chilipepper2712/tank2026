// Campaign story: one comic card per level, shown on the CHIẾN DỊCH screen and (later) before the briefing.
// Placeholders for now: fill `cover`, `panels` or `video` per level. Paths are relative to the site root,
// e.g. 'story/01-cover.webp' for a file in public/story/.

export interface StoryPanel {
  image: string; // one comic panel
  caption?: string; // narration or a line of dialogue under the panel
}

export interface StoryCard {
  level: number; // 1–10, matches LEVELS
  headline?: string; // one-line hook on the card; defaults to the level title
  cover?: string; // image on the card
  panels: StoryPanel[]; // the comic, read in order before the mission
  video?: string; // or a short clip instead of panels
}

export const STORY: StoryCard[] = [
  { level: 1, panels: [] },
  { level: 2, panels: [] },
  { level: 3, panels: [] },
  { level: 4, panels: [] },
  { level: 5, panels: [] },
  { level: 6, panels: [] },
  { level: 7, panels: [] },
  { level: 8, panels: [] },
  { level: 9, panels: [] },
  { level: 10, panels: [] },
];
