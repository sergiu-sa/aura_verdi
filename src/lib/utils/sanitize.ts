/**
 * Input sanitization utilities.
 *
 * All user-provided text that will be stored or displayed must be sanitized.
 * Financial data is sensitive — strip HTML injection vectors.
 */

/**
 * Sanitizes a general text input (chat messages, notes, etc.).
 * - Removes HTML angle brackets (XSS prevention)
 * - Trims whitespace
 * - Enforces max length
 */
export function sanitizeInput(input: string, maxLength = 10_000): string {
  return input
    .replace(/[<>]/g, '') // Strip HTML angle brackets
    .trim()
    .slice(0, maxLength)
}

/**
 * Sanitizes a filename for safe storage in Supabase Storage.
 * - Allows letters, digits, Norwegian characters, dots, hyphens, underscores
 * - Prevents path traversal (../)
 * - Enforces max filename length
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9æøåÆØÅ._-]/g, '_') // Allow Norwegian characters
    .replace(/\.{2,}/g, '.') // Prevent path traversal via ../
    .slice(0, 255) // Max filename length
}

/**
 * Validates that a file's magic bytes match the expected MIME type.
 * Never trust the Content-Type header or file extension alone.
 *
 * Call this in the document upload API route before processing.
 *
 * @param file - The File object from FormData
 * @returns true if the file's content matches an allowed type
 */
export async function validateFileMagicBytes(file: File): Promise<boolean> {
  // Read first 8 bytes to check magic bytes (file signature)
  const buffer = await file.slice(0, 8).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // Magic byte signatures for allowed file types
  const signatures: Record<string, number[][]> = {
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'image/jpeg': [[0xff, 0xd8, 0xff]],
    'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], // .PNG
    'image/heic': [
      // HEIC/HEIF (ftyp box — bytes 4-7 are 'ftyp')
      [0x00, 0x00, 0x00, 0x00, 0x66, 0x74, 0x79, 0x70],
    ],
  }

  return Object.entries(signatures).some(([, sigs]) =>
    sigs.some((sig) => sig.every((byte, i) => bytes[i] === byte))
  )
}
