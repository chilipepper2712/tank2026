/*
 * Key art shown on the briefing before each level (public/art/level-NN.jpg, 1280 px wide).
 * A level missing here gets the drawn placeholder frame instead. To add or swap a picture:
 * drop the file in public/art and list its level number below.
 * Training has no picture of its own: it shows the last frame of its story (see src/story.ts).
 */
const HAVE = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

export const levelArt = (n: number) =>
  n === 0 ? 'art/intro-00-2.jpg' : HAVE.has(n) ? `art/level-${String(n).padStart(2, '0')}.jpg` : null;
