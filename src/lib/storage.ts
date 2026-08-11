"use client";

import type { SplitHistoryItem, UserPreferences } from "@/types";

const HISTORY_KEY = "divideai_history";
const PREFS_KEY = "divideai_prefs";
const FREE_HISTORY_LIMIT = 5;

export function getPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return { isPro: false, theme: "system", historyLimit: FREE_HISTORY_LIMIT };
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      return JSON.parse(raw) as UserPreferences;
    }
  } catch {
    // ignore
  }
  return { isPro: false, theme: "system", historyLimit: FREE_HISTORY_LIMIT };
}

export function savePreferences(prefs: UserPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function getHistory(): SplitHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw) as SplitHistoryItem[];
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveToHistory(item: Omit<SplitHistoryItem, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const prefs = getPreferences();
  const history = getHistory();
  
  const newItem: SplitHistoryItem = {
    ...item,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };

  let updated = [newItem, ...history];
  
  // Limit for free users
  if (!prefs.isPro) {
    updated = updated.slice(0, FREE_HISTORY_LIMIT);
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}

export function setProStatus(isPro: boolean) {
  const prefs = getPreferences();
  savePreferences({ ...prefs, isPro });
}
