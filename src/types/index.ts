export type Person = {
  id: string;
  name: string;
  isDrinker?: boolean;
};

export type BillItem = {
  id: string;
  name: string;
  amount: number;
  category: "carne" | "bebida" | "extra";
  participants: string[]; // person ids
};

export type NormalSplit = {
  type: "normal";
  total: number;
  peopleCount: number;
  tipPercent: number;
  tipCustom?: number;
  equalSplit: boolean;
  customAmounts?: Record<string, number>;
  people: Person[];
  resultPerPerson: number;
  totalWithTip: number;
};

export type BBQSplit = {
  type: "bbq";
  items: BillItem[];
  people: Person[];
  tipPercent: number;
  tipCustom?: number;
  results: Record<string, number>; // personId -> amount
  totalWithTip: number;
};

export type SplitHistoryItem = {
  id: string;
  createdAt: string;
  title: string;
  mode: "normal" | "bbq";
  total: number;
  peopleCount: number;
  data: NormalSplit | BBQSplit;
};

export type UserPreferences = {
  isPro: boolean;
  theme: "light" | "dark" | "system";
  historyLimit: number;
};
