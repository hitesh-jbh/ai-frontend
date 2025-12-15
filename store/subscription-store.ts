import { create } from "zustand";
import { Subscription, SubscriptionStatus } from "../services/subscription.service";

interface SubscriptionState {
  subscription: Subscription | null;
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  setSubscription: (subscription: Subscription | null) => void;
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void;
  setLoading: (loading: boolean) => void;
  refreshSubscription: () => Promise<void>;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  subscriptionStatus: null,
  isLoading: false,

  setSubscription: (subscription) => {
    set({ subscription });
  },

  setSubscriptionStatus: (status) => {
    set({ subscriptionStatus: status });
    // Also update subscription if available
    if (status?.subscription) {
      set({ subscription: status.subscription });
    }
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  refreshSubscription: async () => {
    // This will be called from components that have access to services
    // The actual API call will be made in the component using the service
    set({ isLoading: true });
  },

  clearSubscription: () => {
    set({ subscription: null, subscriptionStatus: null });
  },
}));

