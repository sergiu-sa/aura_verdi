/**
 * Norwegian banks available via the Neonomics API.
 * These are the bank IDs used when creating a Neonomics session.
 * Verified against the Neonomics sandbox bank list.
 *
 * NOTE: Get the complete list by calling GET /ics/v3/banks from the Neonomics API.
 * This is a seeding list of major Norwegian banks.
 */

export interface NorwegianBank {
  /** Neonomics bank identifier */
  id: string
  /** Display name */
  name: string
  /** Logo/icon path in /public/banks/ (add SVGs later) */
  logoPath?: string
  /** Whether this bank is commonly used (shown at top of list) */
  popular?: boolean
}

export const NORWEGIAN_BANKS: NorwegianBank[] = [
  { id: 'dnb-no', name: 'DNB', popular: true },
  { id: 'nordea-no', name: 'Nordea', popular: true },
  { id: 'sparebank1-no', name: 'SpareBank 1', popular: true },
  { id: 'handelsbanken-no', name: 'Handelsbanken', popular: true },
  { id: 'storebrand-no', name: 'Storebrand', popular: false },
  { id: 'sbanken-no', name: 'Sbanken (DNB)', popular: true },
  { id: 'komplett-bank-no', name: 'Komplett Bank', popular: false },
  { id: 'ya-bank-no', name: 'ya bank', popular: false },
  { id: 'bulder-bank-no', name: 'Bulder Bank', popular: false },
  { id: 'instabank-no', name: 'Instabank', popular: false },
]

/** Popular banks shown first in the bank picker UI */
export const POPULAR_BANKS = NORWEGIAN_BANKS.filter((b) => b.popular)
