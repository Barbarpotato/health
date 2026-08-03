// Points admin awards per category — fixed per category, not entered manually.
module.exports = {
  olahraga: 10,
  journaling: 10,
  learning: 10,
  'mindful nutrition': 10,
  bonus: 5,
};

// Bonus is the one category where admin picks the amount instead of a fixed value.
module.exports.BONUS_POINT_OPTIONS = [5, 10];
