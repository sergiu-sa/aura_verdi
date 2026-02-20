-- ═══════════════════════════════════════════════════════════════════════════
-- AURA — Supabase Storage RLS Policies
-- Migration: 003_storage_policies.sql
-- Run AFTER creating the 'user-documents' storage bucket in the Supabase dashboard.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- BEFORE running this migration, create the storage bucket:
--   Supabase Dashboard → Storage → New bucket
--   Name: user-documents
--   Public: NO (private)
--   File size limit: 10485760 (10MB)
--   Allowed MIME types: application/pdf,image/jpeg,image/png,image/heic,text/csv
--

-- Users can upload files to their own folder (path starts with their UUID)
CREATE POLICY "Users upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own files
CREATE POLICY "Users read own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
CREATE POLICY "Users delete own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
