import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServices } from "../hooks/useServices";
import { useSubscriptionStore } from "../store/subscription-store";
import { useAuthStore } from "../store/auth-store";

/**
 * Component that fetches subscription status when user is authenticated
 * Should be placed in a component that renders after auth initialization
 */
export function SubscriptionInitializer() {
  const { subscription } = useServices();
  const { setSubscriptionStatus, clearSubscription } = useSubscriptionStore();
  const { isAuthenticated, user } = useAuthStore();

  const { data: currentStatus } = useQuery({
    queryKey: ["subscriptionStatus", user?.id], // Include user ID in query key to prevent cache sharing
    queryFn: () => subscription.getCurrentStatus(),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 0, // Always refetch when enabled to ensure fresh data
    retry: 1,
  });

  // Clear subscription when user logs out
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      clearSubscription();
    }
  }, [isAuthenticated, user?.id, clearSubscription]);

  // Update store when status is fetched
  useEffect(() => {
    if (currentStatus) {
      setSubscriptionStatus(currentStatus);
    } else if (isAuthenticated && user?.id && currentStatus === undefined) {
      // If authenticated but no status yet, clear to avoid stale data
      clearSubscription();
    }
  }, [currentStatus, setSubscriptionStatus, isAuthenticated, user?.id, clearSubscription]);

  return null; // This component doesn't render anything
}
