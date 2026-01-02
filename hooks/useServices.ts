import { useMemo } from "react";
import useAxiosPrivate from "./useAxiosPrivate";
import { createSearchService } from "../services/search.service";
import { createLeaderboardService } from "../services/leaderboard.service";
import { createAnalyticsService } from "../services/analytics.service";
import { createVaultService } from "../services/vault.service";
import { createResourceService } from "../services/resource.service";
import { createProfileService } from "../services/profile.service";
import { createRewardService } from "../services/reward.service";
import { createSubscriptionService } from "../services/subscription.service";
import { createCoinRedemptionService } from "../services/coin-redemption.service";
import { createSearchAdRevenueService } from "../services/search-ad-revenue.service";

export const useServices = () => {
  const axiosInstance = useAxiosPrivate();

  return useMemo(() => {
    const services = {
      search: createSearchService(axiosInstance),
      leaderboard: createLeaderboardService(axiosInstance),
      analytics: createAnalyticsService(axiosInstance),
      vault: createVaultService(axiosInstance),
      resource: createResourceService(axiosInstance),
      profile: createProfileService(axiosInstance),
      reward: createRewardService(axiosInstance),
      subscription: createSubscriptionService(axiosInstance),
      coinRedemption: createCoinRedemptionService(axiosInstance),
      searchAdRevenue: createSearchAdRevenueService(axiosInstance),
    };
    return services;
  }, [axiosInstance]);
};
