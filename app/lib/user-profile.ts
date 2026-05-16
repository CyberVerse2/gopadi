export type UserProfile = {
  name: string;
  handle: string;
};

const CUSTOMER_PROFILES: UserProfile[] = [
  { name: "Ada Nnamani", handle: "@ada_orders" },
  { name: "Ifeanyi Umeh", handle: "@ifeanyi" },
  { name: "Nora Eze", handle: "@nora" },
  { name: "Somto Obi", handle: "@somto" },
];

function hashValue(value?: string | null) {
  if (!value) return 0;
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getCustomerProfile(wallet?: string | null): UserProfile | null {
  if (!wallet) return null;
  return CUSTOMER_PROFILES[hashValue(wallet) % CUSTOMER_PROFILES.length];
}
