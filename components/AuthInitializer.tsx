import { useEffect } from "react";
import { useAuthStore } from "../store/auth-store";

/**
 * Component that initializes authentication state on app load
 * Checks for stored tokens and fetches user profile if authenticated
 */
export function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return null; // This component doesn't render anything
}
