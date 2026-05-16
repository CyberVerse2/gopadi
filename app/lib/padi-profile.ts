export type PadiProfile = {
  name: string;
  handle: string;
  rating: string;
  completed: number;
  distance: string;
  eta: string;
  specialty: string;
  area: string;
  bio: string;
  avatar: string;
};

const PROFILES: Omit<PadiProfile, "avatar">[] = [
  {
    name: "Chinedu Okafor",
    handle: "@chinedu_runs",
    rating: "4.8",
    completed: 23,
    distance: "1.4km",
    eta: "12 min",
    specialty: "Market errands",
    area: "Ogbete, UNN, Hilltop",
    bio: "Fast with foodstuff, receipts, and hostel handoffs.",
  },
  {
    name: "Amina Yusuf",
    handle: "@amina_padi",
    rating: "4.9",
    completed: 41,
    distance: "1.1km",
    eta: "10 min",
    specialty: "Medicine pickup",
    area: "Nsukka town, campus gate",
    bio: "Careful with prescriptions, pharmacy receipts, and recipient calls.",
  },
  {
    name: "Tobi Eze",
    handle: "@tobi_delivers",
    rating: "4.7",
    completed: 18,
    distance: "2.0km",
    eta: "16 min",
    specialty: "Campus delivery",
    area: "UNN, Odenigwe, behind flat",
    bio: "Reliable for documents, packages, and quick campus movement.",
  },
  {
    name: "Kemi Nwosu",
    handle: "@kemi_shops",
    rating: "5.0",
    completed: 36,
    distance: "1.8km",
    eta: "14 min",
    specialty: "Groceries",
    area: "Ogige, Ogbete, hostels",
    bio: "Checks prices before buying and confirms substitutions in chat.",
  },
];

function hashWallet(wallet?: string | null) {
  if (!wallet) return 0;
  let hash = 0;
  for (let i = 0; i < wallet.length; i += 1) {
    hash = (hash * 31 + wallet.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getPadiProfile(wallet?: string | null): PadiProfile | null {
  if (!wallet) return null;
  const hash = hashWallet(wallet);
  const profile = PROFILES[hash % PROFILES.length];
  return {
    ...profile,
    avatar: profile.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
}
