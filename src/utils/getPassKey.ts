// getPassKey — derives a key from a passphrase using a simple hash
// This is a placeholder; the real implementation may use WebCrypto or a KDF

export default function getPassKey(passphrase: string): string {
  // Simple deterministic key derivation (matches original automa behavior)
  let hash = 0;
  for (let i = 0; i < passphrase.length; i++) {
    const char = passphrase.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36).padStart(8, '0');
}
