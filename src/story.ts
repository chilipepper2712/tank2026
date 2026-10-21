// Campaign story: one card per level, shown on the CHIẾN DỊCH screen; its panels, if any, are read
// one by one on the briefing screen before the orders. Paths are relative to the site root, e.g.
// 'art/intro-00-1.jpg' for a file in public/art/. The card cover defaults to the level's key art.

export interface StoryPanel {
  image: string; // one comic panel
  caption: string; // key in the language file for the narration beside the panel
}

export interface StoryCard {
  level: number; // 0 (training) to 10, matches LEVELS
  headline?: string; // one-line hook on the card; defaults to the level title
  cover?: string; // image on the card
  panels: StoryPanel[]; // the comic, read in order before the mission
  video?: string; // or a short clip instead of panels
}

export const STORY: StoryCard[] = [
  {
    level: 0,
    panels: [
      { image: 'art/intro-00-1.jpg', caption: 'intro.0.1' },
      { image: 'art/intro-00-2.jpg', caption: 'intro.0.2' },
    ],
  },
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
