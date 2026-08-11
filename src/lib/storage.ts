"use client";

import type { SplitHistoryItem, UserPreferences } from "@/types";

const PREFS_KEY = "pagajuntos_prefs";
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

/** Salva no banco (por usuário logado). Não usa localStorage compartilhado. */
export async function saveToHistory(
  item: Omit<SplitHistoryItem, "id" | "createdAt">
) {
  try {
    await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  } catch (e) {
    console.error("Erro ao salvar histórico", e);
  }
}

export function setProStatus(isPro: boolean) {
  const prefs = getPreferences();
  savePreferences({ ...prefs, isPro });
}
