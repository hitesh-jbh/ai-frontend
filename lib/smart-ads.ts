import AsyncStorage from "@react-native-async-storage/async-storage";

type EligibleSource = "vault" | "free_ai" | "paid_ai";

const STORAGE_KEYS = {
  searchCount: "smartAds.searchCount",
  chatResponseCount: "smartAds.chatResponseCount",
} as const;

export function shouldShowAd(source: string): source is EligibleSource {
  return source === "vault" || source === "free_ai" || source === "paid_ai";
}

async function getNumber(key: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

async function setNumber(key: string, value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(key, String(value));
  } catch {
    // fail-open; counters are best-effort
  }
}

async function increment(key: string): Promise<number> {
  const current = await getNumber(key);
  const next = current + 1;
  await setNumber(key, next);
  return next;
}

export async function incrementSearchCount(): Promise<number> {
  return increment(STORAGE_KEYS.searchCount);
}

export async function incrementChatResponseCount(): Promise<number> {
  return increment(STORAGE_KEYS.chatResponseCount);
}

