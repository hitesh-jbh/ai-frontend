import { useEffect } from "react";
import { axiosInstance } from "../lib/axios";

/**
 * Hook that sets up axios for public API calls (login, register, etc)
 * Does NOT set up authentication interceptors
 * Use this in auth screens (login, signup, forgot-password)
 * Use useAxiosPrivate() for authenticated screens instead
 */
const usePublicAxios = () => {
  useEffect(() => {
    // Remove any existing interceptors we might have added
    // (This is handled by cleanup function returning from useAxiosPrivate)
    // For public calls, we just use the base axiosInstance without extra interceptors
  }, []);

  return axiosInstance;
};

export default usePublicAxios;
