import { useMemo } from "react";
import useAxiosPrivate from "./useAxiosPrivate";
import { createSearchService } from "../services/search.service";
import { createLeaderboardService } from "../services/leaderboard.service";
import { createVaultService } from "../services/vault.service";
import { createResourceService } from "../services/resource.service";
import { createProfileService } from "../services/profile.service";
import { createRewardService } from "../services/reward.service";

export const useServices = () => {
  const axiosInstance = useAxiosPrivate();

  return useMemo(
    () => ({
      search: createSearchService(axiosInstance),
      leaderboard: createLeaderboardService(axiosInstance),
      vault: createVaultService(axiosInstance),
      resource: createResourceService(axiosInstance),
      profile: createProfileService(axiosInstance),
      reward: createRewardService(axiosInstance),
    }),
    [axiosInstance]
  );
};

