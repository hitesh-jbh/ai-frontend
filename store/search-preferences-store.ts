import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type SearchLayer =
  | "automatic"
  | "cache"
  | "competitive"
  | "community"
  | "paid_ai";

interface SearchPreferencesState {
  preferredLayer: SearchLayer;
  setPreferredLayer: (layer: SearchLayer) => Promise<void>;
  initialize: () => Promise<void>;
}

const STORAGE_KEY = "search_preferred_layer";

export const useSearchPreferencesStore = create<SearchPreferencesState>(
  (set) => ({
    preferredLayer: "automatic", // Default to automatic

    initialize: async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (stored) {
          const layer = stored as SearchLayer;
          // Validate the stored value
          if (
            ["automatic", "cache", "competitive", "community", "paid_ai"].includes(
              layer
            )
          ) {
            set({ preferredLayer: layer });
          }
        }
      } catch (error) {
        console.error("Error initializing search preferences:", error);
        // Keep default value
      }
    },

    setPreferredLayer: async (layer: SearchLayer) => {
      try {
        await SecureStore.setItemAsync(STORAGE_KEY, layer);
        set({ preferredLayer: layer });
      } catch (error) {
        console.error("Error saving search preferences:", error);
      }
    },
  })
);

