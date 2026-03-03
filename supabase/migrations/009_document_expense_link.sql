-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 009 — Link bills_upcoming to source documents
--
-- Adds a source_document_id FK so bills created from analyzed documents
-- maintain a reference back. ON DELETE SET NULL keeps the bill if the
-- document is later removed.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.bills_upcoming
  ADD COLUMN source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL;

-- Fast lookup: "has this document already been added as an expense?"
CREATE INDEX idx_bills_source_doc
  ON public.bills_upcoming(source_document_id)
  WHERE source_document_id IS NOT NULL;
