/**
 * Spending categories for Aura.
 * Norwegian labels — displayed in the app.
 * Keys are stored in the database 'category' column.
 */

export const SPENDING_CATEGORIES = {
  mat: {
    label: 'Mat & dagligvarer',
    emoji: '🛒',
    color: '#4CAF50',
    tailwindColor: 'text-green-400',
  },
  restaurant: {
    label: 'Restaurant & takeaway',
    emoji: '🍽️',
    color: '#FF9800',
    tailwindColor: 'text-orange-400',
  },
  transport: {
    label: 'Transport',
    emoji: '🚗',
    color: '#2196F3',
    tailwindColor: 'text-blue-400',
  },
  bolig: {
    label: 'Bolig & husleie',
    emoji: '🏠',
    color: '#9C27B0',
    tailwindColor: 'text-purple-400',
  },
  strom: {
    label: 'Strøm & energi',
    emoji: '⚡',
    color: '#FFC107',
    tailwindColor: 'text-yellow-400',
  },
  forsikring: {
    label: 'Forsikring',
    emoji: '🛡️',
    color: '#607D8B',
    tailwindColor: 'text-slate-400',
  },
  helse: {
    label: 'Helse & medisin',
    emoji: '🏥',
    color: '#F44336',
    tailwindColor: 'text-red-400',
  },
  underholdning: {
    label: 'Underholdning',
    emoji: '🎬',
    color: '#E91E63',
    tailwindColor: 'text-pink-400',
  },
  klaer: {
    label: 'Klær & sko',
    emoji: '👕',
    color: '#795548',
    tailwindColor: 'text-amber-700',
  },
  abonnement: {
    label: 'Abonnementer',
    emoji: '📱',
    color: '#00BCD4',
    tailwindColor: 'text-cyan-400',
  },
  trening: {
    label: 'Trening & helse',
    emoji: '💪',
    color: '#8BC34A',
    tailwindColor: 'text-lime-400',
  },
  lan: {
    label: 'Lån & renter',
    emoji: '🏦',
    color: '#FF5722',
    tailwindColor: 'text-orange-500',
  },
  sparing: {
    label: 'Sparing',
    emoji: '💰',
    color: '#0D7377',
    tailwindColor: 'text-teal-400',
  },
  overforinger: {
    label: 'Overføringer',
    emoji: '💸',
    color: '#9E9E9E',
    tailwindColor: 'text-gray-400',
  },
  inntekt: {
    label: 'Inntekt',
    emoji: '💰',
    color: '#4CAF50',
    tailwindColor: 'text-green-400',
  },
  annet: {
    label: 'Annet',
    emoji: '📎',
    color: '#BDBDBD',
    tailwindColor: 'text-gray-300',
  },
  ukategorisert: {
    label: 'Ukategorisert',
    emoji: '❓',
    color: '#757575',
    tailwindColor: 'text-gray-500',
  },
} as const

export type SpendingCategory = keyof typeof SPENDING_CATEGORIES

/** All category keys as an array (useful for Zod enums and selects) */
export const CATEGORY_KEYS = Object.keys(SPENDING_CATEGORIES) as SpendingCategory[]
