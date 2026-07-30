// Mirrors lib/points.js on the backend — points are fixed per category.
export const POINTS_BY_CATEGORY = {
  'physical wellness': 10,
  'mental wellness': 10,
  'intellectual wellness': 10,
  'mindful nutrition': 10,
  'bonus activity': 5,
};

export function pointsFor(category) {
  return POINTS_BY_CATEGORY[category] ?? 0;
}
