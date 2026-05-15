export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}
