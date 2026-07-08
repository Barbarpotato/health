import { Dumbbell, Brain, BookOpen, Salad } from 'lucide-react';

// The 3 selectable categories — user picks exactly one per post.
export const CATEGORIES = [
  {
    value: 'physical wellness',
    label: 'Physical',
    icon: Dumbbell,
    color: 'text-orange-700 dark:text-orange-300',
    ring: 'ring-orange-400/30',
    bg: 'bg-orange-500/10',
    gradient: 'from-orange-500/10 to-red-500/5 dark:from-orange-500/20 dark:to-red-500/10',
  },
  {
    value: 'mental wellness',
    label: 'Mental',
    icon: Brain,
    color: 'text-violet-700 dark:text-violet-300',
    ring: 'ring-violet-400/30',
    bg: 'bg-violet-500/10',
    gradient: 'from-violet-500/10 to-indigo-500/5 dark:from-violet-500/20 dark:to-indigo-500/10',
  },
  {
    value: 'intellectual wellness',
    label: 'Intellectual',
    icon: BookOpen,
    color: 'text-teal-700 dark:text-teal-300',
    ring: 'ring-teal-400/30',
    bg: 'bg-teal-500/10',
    gradient: 'from-teal-500/10 to-emerald-500/5 dark:from-teal-500/20 dark:to-emerald-500/10',
  },
];

// Mandatory companion category — every post also requires a mindful_nutrition
// child activity (see routes/activities.js parent_id).
export const MINDFUL_NUTRITION = {
  value: 'mindful nutrition',
  label: 'Mindful Nutrition',
  icon: Salad,
  color: 'text-lime-700 dark:text-lime-300',
  ring: 'ring-lime-400/30',
  bg: 'bg-lime-500/10',
  gradient: 'from-lime-500/10 to-green-500/5 dark:from-lime-500/20 dark:to-green-500/10',
};

const ALL_CATEGORIES = [...CATEGORIES, MINDFUL_NUTRITION];

export function categoryMeta(value) {
  return ALL_CATEGORIES.find((c) => c.value === value) || CATEGORIES[0];
}
