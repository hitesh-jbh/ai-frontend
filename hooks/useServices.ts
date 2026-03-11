import { useMemo } from "react";
import { createAddonService } from "../services/addon.service";
import { createAnalyticsService } from "../services/analytics.service";
import { createCoinRedemptionService } from "../services/coin-redemption.service";
import { createLeaderboardService } from "../services/leaderboard.service";
import { createPlatformStatsService } from "../services/platform-stats.service";
import { createProfileService } from "../services/profile.service";
import { createResourceService } from "../services/resource.service";
import { createRewardService } from "../services/reward.service";
import { createSearchAdRevenueService } from "../services/search-ad-revenue.service";
import { createSearchService } from "../services/search.service";
import { createSpaceExtensionService } from "../services/space-extension.service";
import { createSubscriptionService } from "../services/subscription.service";
import { createThreadService } from "../services/thread.service";
import { createVaultService } from "../services/vault.service";
import { createWalletService } from "../services/wallet.service";
import useAxiosPrivate from "./useAxiosPrivate";

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
      addon: createAddonService(axiosInstance),
      spaceExtension: createSpaceExtensionService(axiosInstance),
      coinRedemption: createCoinRedemptionService(axiosInstance),
      thread: createThreadService(axiosInstance),
      wallet: createWalletService(axiosInstance),
      platformStats: createPlatformStatsService(axiosInstance),
      searchAdRevenue: createSearchAdRevenueService(axiosInstance),
    };
    return services;
  }, [axiosInstance]);
};
