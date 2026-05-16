export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

export function generateHandoffCode(): string {
  return crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
}
