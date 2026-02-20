/**
 * Norwegian legal references for Aura's legal knowledge base.
 *
 * IMPORTANT: Legal information can become outdated.
 * Each reference has a lastVerified date.
 * Alert users when they rely on references older than 12 months.
 *
 * Key update (January 2026):
 * New debt collection rules took effect. Multiple collection authorities
 * merged into the Collection Authority in the Tax Administration (Innkrevingsmyndigheten).
 * Reference: skatteetaten.no for current inkasso rules.
 */

export interface LegalReference {
  /** Short identifier */
  key: string
  /** Norwegian law name */
  nameno: string
  /** English name */
  nameen: string
  /** Lovdata URL */
  lovdataUrl: string
  /** When this reference was last verified for accuracy */
  lastVerified: string
  /** Brief description of relevance to Aura users */
  relevance: string
}

export const LEGAL_REFERENCES: LegalReference[] = [
  {
    key: 'inkassoloven',
    nameno: 'Inkassoloven',
    nameen: 'Debt Collection Act',
    lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1988-05-13-26',
    lastVerified: '2026-01-15',
    relevance:
      'Governs debt collection procedure: inkassovarsel (14-day notice), betalingsoppfordring, and maximum fees. Updated Jan 2026: collection now under Innkrevingsmyndigheten i Skatteetaten.',
  },
  {
    key: 'husleieloven',
    nameno: 'Husleieloven',
    nameen: 'Tenancy Act',
    lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1999-03-26-17',
    lastVerified: '2026-01-15',
    relevance:
      'Tenant rights: rent increase limits (KPI-based), deposit rules, eviction procedure, maintenance obligations.',
  },
  {
    key: 'finansavtaleloven',
    nameno: 'Finansavtaleloven',
    nameen: 'Financial Contracts Act',
    lovdataUrl: 'https://lovdata.no/dokument/NL/lov/2020-05-22-32',
    lastVerified: '2026-01-15',
    relevance:
      'Consumer credit rights: right to early repayment, bank obligations, setoff rules. Revised law in force from 2023.',
  },
  {
    key: 'forsinkelsesrenteloven',
    nameno: 'Forsinkelsesrenteloven',
    nameen: 'Late Payment Interest Act',
    lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1976-12-17-100',
    lastVerified: '2026-01-15',
    relevance: 'Maximum late payment interest rates. Current rate published at finansdepartementet.no.',
  },
  {
    key: 'forbrukerkjopsloven',
    nameno: 'Forbrukerkjøpsloven',
    nameen: 'Consumer Purchase Act',
    lovdataUrl: 'https://lovdata.no/dokument/NL/lov/2002-06-21-34',
    lastVerified: '2026-01-15',
    relevance: 'Rights when buying goods/services: warranty, right of return, remedies.',
  },
  {
    key: 'tvangsfullbyrdelsesloven',
    nameno: 'Tvangsfullbyrdelsesloven',
    nameen: 'Enforcement Act',
    lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1992-06-26-86',
    lastVerified: '2026-01-15',
    relevance: 'Asset seizure rules, namsmann procedure. What creditors can and cannot take.',
  },
  {
    key: 'gjeldsordningsloven',
    nameno: 'Gjeldsordningsloven',
    nameen: 'Debt Settlement Act',
    lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1992-07-17-99',
    lastVerified: '2026-01-15',
    relevance: 'Personal debt restructuring/bankruptcy procedures. Option of last resort.',
  },
]

/**
 * Disclaimer that must be shown alongside ALL legal information.
 * Aura is not a lawyer — this is non-negotiable.
 */
export const LEGAL_DISCLAIMER =
  'Aura is not a lawyer. This information is based on publicly available Norwegian law. For legal advice specific to your situation, consult a lawyer (advokat). Verify current rules at lovdata.no or skatteetaten.no.'
