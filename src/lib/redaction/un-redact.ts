/**
 * Un-redaction — restores original values in Claude's analysis output for display.
 *
 * Claude receives the redacted text (with masks like [PERSON A], ████.██.78901).
 * Its analysis output therefore also contains those masks.
 * This function swaps the masks back to the original values so the user sees
 * real names/numbers in the displayed summary.
 *
 * The redactionMap (mask → original) is stored in the database per document.
 */

export function unRedact(
  text: string,
  redactionMap: Record<string, string>
): string {
  let result = text

  // Sort masks by length (longest first) to avoid partial replacements
  // e.g., "[PERSON AB]" must be replaced before "[PERSON A]"
  const masks = Object.keys(redactionMap).sort((a, b) => b.length - a.length)

  for (const mask of masks) {
    const original = redactionMap[mask]
    // Replace all occurrences of the mask with the original value
    result = result.split(mask).join(original)
  }

  return result
}
