/**
 * Get a pass key for encryption/decryption purposes.
 * This is a stub - the actual implementation is provided by the business module.
 */
export default function getPassKey(id: string): string {
  return `automa-key-${id}`;
}
