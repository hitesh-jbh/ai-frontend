import { Platform } from "react-native";
import mobileAds, {
  AdEventType,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

export interface AdConfig {
  adUnitId?: string;
  /**
   * Optional revenue override (INR). If not provided, we use a stable estimate.
   * AdMob does not provide exact per-impression revenue client-side.
   */
  estimatedRevenueInr?: number;
  /**
   * Safety timeout for load/show sequence. Defaults to 30s.
   */
  timeoutMs?: number;
  /**
   * Whether to request non-personalized ads (e.g. GDPR).
   * Defaults to true.
   */
  requestNonPersonalizedAdsOnly?: boolean;
}

export interface AdResult {
  success: boolean;
  revenue?: number; // Estimated revenue in INR (stable estimate)
  error?: string;
}

type AdType = "rewarded" | "interstitial";

const DEFAULT_TIMEOUT_MS = 30_000;
const ESTIMATED_REVENUE_INR: Record<AdType, number> = {
  rewarded: 0.05,
  interstitial: 0.02,
};

/**
 * IMPORTANT:
 * - In dev, we use Google TestIds (safe).
 * - In prod, replace these with your real Ad Unit IDs from AdMob.
 */
const PROD_AD_UNIT_IDS = {
  rewarded: {
    android: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx",
    ios: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx",
  },
  interstitial: {
    android: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx",
    ios: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx",
  },
} as const;

function getAdUnitId(adType: AdType): string {
  if (__DEV__) {
    return adType === "rewarded" ? TestIds.REWARDED : TestIds.INTERSTITIAL;
  }
  const platform = Platform.OS === "ios" ? "ios" : "android";
  return PROD_AD_UNIT_IDS[adType][platform];
}

class AdMobAdManager {
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = mobileAds()
        .initialize()
        .then(() => {
          console.log("[AdMob] Initialized");
        })
        .catch((e) => {
          // Do not crash the app if ads fail; we fail-open everywhere.
          console.error("[AdMob] Initialization failed:", e?.message ?? e);
        });
    }
    await this.initPromise;
  }

  async showRewardedAd(config?: AdConfig): Promise<AdResult> {
    await this.initialize();

    const adUnitId = config?.adUnitId ?? getAdUnitId("rewarded");
    const timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const estimatedRevenueInr =
      config?.estimatedRevenueInr ?? ESTIMATED_REVENUE_INR.rewarded;
    const requestNonPersonalizedAdsOnly =
      config?.requestNonPersonalizedAdsOnly ?? true;

    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly,
    });

    return await new Promise<AdResult>((resolve) => {
      let settled = false;
      let rewardEarned = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;

      const cleanup: (() => void)[] = [];

      const resolveOnce = (result: AdResult) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        for (const unsub of cleanup) {
          try {
            unsub();
          } catch {}
        }
        resolve(result);
      };

      timeout = setTimeout(() => {
        resolveOnce({ success: false, error: "Rewarded ad timeout" });
      }, timeoutMs);

      cleanup.push(
        rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
          try {
            rewarded.show();
          } catch (e: any) {
            resolveOnce({
              success: false,
              error: e?.message ?? "Failed to show rewarded ad",
            });
          }
        })
      );

      cleanup.push(
        rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          rewardEarned = true;
        })
      );

      cleanup.push(
        rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
          resolveOnce({
            success: false,
            error: error?.message ?? "Rewarded ad error",
          });
        })
      );

      cleanup.push(
        rewarded.addAdEventListener(AdEventType.CLOSED, () => {
          // Requirement: only succeed AFTER reward earned.
          if (!rewardEarned) {
            resolveOnce({ success: false, error: "Reward not earned" });
            return;
          }
          resolveOnce({ success: true, revenue: estimatedRevenueInr });
        })
      );

      try {
        rewarded.load();
      } catch (e: any) {
        resolveOnce({
          success: false,
          error: e?.message ?? "Failed to load rewarded ad",
        });
      }
    });
  }

  async showInterstitialAd(config?: AdConfig): Promise<AdResult> {
    await this.initialize();

    const adUnitId = config?.adUnitId ?? getAdUnitId("interstitial");
    const timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const estimatedRevenueInr =
      config?.estimatedRevenueInr ?? ESTIMATED_REVENUE_INR.interstitial;
    const requestNonPersonalizedAdsOnly =
      config?.requestNonPersonalizedAdsOnly ?? true;

    const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly,
    });

    return await new Promise<AdResult>((resolve) => {
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const cleanup: (() => void)[] = [];

      const resolveOnce = (result: AdResult) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        for (const unsub of cleanup) {
          try {
            unsub();
          } catch {}
        }
        resolve(result);
      };

      timeout = setTimeout(() => {
        resolveOnce({ success: false, error: "Interstitial ad timeout" });
      }, timeoutMs);

      cleanup.push(
        interstitial.addAdEventListener(AdEventType.LOADED, () => {
          try {
            interstitial.show();
          } catch (e: any) {
            resolveOnce({
              success: false,
              error: e?.message ?? "Failed to show interstitial ad",
            });
          }
        })
      );

      cleanup.push(
        interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
          resolveOnce({
            success: false,
            error: error?.message ?? "Interstitial ad error",
          });
        })
      );

      cleanup.push(
        interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          resolveOnce({ success: true, revenue: estimatedRevenueInr });
        })
      );

      try {
        interstitial.load();
      } catch (e: any) {
        resolveOnce({
          success: false,
          error: e?.message ?? "Failed to load interstitial ad",
        });
      }
    });
  }
}

export const adMobAdManager = new AdMobAdManager();
