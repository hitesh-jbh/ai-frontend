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
  currentUserId: string | null;
  setPreferredLayer: (layer: SearchLayer, userId: string) => Promise<void>;
  initialize: (userId: string) => Promise<void>;
  clearPreferences: () => Promise<void>;
}

const getStorageKey = (userId: string) => `search_preferred_layer_${userId}`;

export const useSearchPreferencesStore = create<SearchPreferencesState>(
  (set, get) => ({
    preferredLayer: "automatic", // Default to automatic
    currentUserId: null,

    initialize: async (userId: string) => {
      try {
        // If user changed, reset to default first
        if (get().currentUserId && get().currentUserId !== userId) {
          set({ preferredLayer: "automatic", currentUserId: userId });
        }

        const storageKey = getStorageKey(userId);
        const stored = await SecureStore.getItemAsync(storageKey);
        
        if (stored) {
          const layer = stored as SearchLayer;
          // Validate the stored value
          if (
            ["automatic", "cache", "competitive", "community", "paid_ai"].includes(
              layer
            )
          ) {
            set({ preferredLayer: layer, currentUserId: userId });
          } else {
            set({ preferredLayer: "automatic", currentUserId: userId });
          }
        } else {
          set({ preferredLayer: "automatic", currentUserId: userId });
        }
      } catch (error) {
        console.error("Error initializing search preferences:", error);
        // Keep default value
        set({ preferredLayer: "automatic", currentUserId: userId });
      }
    },

    setPreferredLayer: async (layer: SearchLayer, userId: string) => {
      try {
        const storageKey = getStorageKey(userId);
        await SecureStore.setItemAsync(storageKey, layer);
        set({ preferredLayer: layer, currentUserId: userId });
      } catch (error) {
        console.error("Error saving search preferences:", error);
      }
    },

    clearPreferences: async () => {
      try {
        // Clear preferences for current user if exists
        if (get().currentUserId) {
          const storageKey = getStorageKey(get().currentUserId!);
          await SecureStore.deleteItemAsync(storageKey);
        }
        set({ preferredLayer: "automatic", currentUserId: null });
      } catch (error) {
        console.error("Error clearing search preferences:", error);
      }
    },
  })
);

