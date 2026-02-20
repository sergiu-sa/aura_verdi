/**
 * Types for the Neonomics Open Banking API responses.
 * Based on Neonomics PSD2 API documentation.
 */

export interface NeonomicsAccount {
  id: string
  bban?: string
  iban?: string
  name?: string
  product?: string
  resourceId?: string
  currency?: string
  accountType?: string
}

export interface NeonomicsBalance {
  balanceAmount: {
    amount: string
    currency: string
  }
  balanceType: 'closingBooked' | 'expected' | 'authorised' | 'openingBooked'
  referenceDate?: string
}

export interface NeonomicsTransaction {
  transactionId?: string
  entryReference?: string
  bookingDate: string
  valueDate?: string
  transactionAmount: {
    amount: string
    currency: string
  }
  creditorName?: string
  debtorName?: string
  remittanceInformationUnstructured?: string
  remittanceInformationStructured?: string
  bankTransactionCode?: string
  proprietaryBankTransactionCode?: string
}

export interface NeonomicsTransactionsResponse {
  account: {
    iban?: string
    bban?: string
  }
  transactions: {
    booked: NeonomicsTransaction[]
    pending?: NeonomicsTransaction[]
  }
}

export interface NeonomicsSession {
  sessionId: string
  bankId: string
  consentLifetime?: number
}

export interface NeonomicsConsentResponse {
  links: {
    scaRedirect?: string
    scaOAuth?: string
  }
  consentId?: string
  consentStatus?: string
}

export interface NeonomicsTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope?: string
}
