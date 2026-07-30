// Mirrors lib/points.js on the backend — points are fixed per category.
export const POINTS_BY_CATEGORY = {
  olahraga: 10,
  journaling: 10,
  learning: 10,
  'mindful nutrition': 10,
  bonus: 5,
};

export function pointsFor(category) {
  return POINTS_BY_CATEGORY[category] ?? 0;
}
