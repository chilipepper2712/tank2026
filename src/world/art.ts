/*
 * Key art shown on the briefing before each level (public/art/level-NN.jpg, 1280 px wide).
 * A level missing here gets the drawn placeholder frame instead. To add or swap a picture:
 * drop the file in public/art and list its level number below.
 */
const HAVE = new Set([0, 2, 5, 6, 7]);

export const levelArt = (n: number) => (HAVE.has(n) ? `art/level-${String(n).padStart(2, '0')}.jpg` : null);
