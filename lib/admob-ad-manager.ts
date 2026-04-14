/**
 * AdMob Ad Manager - COMMENTED OUT (Google Mobile Ads / react-native-google-mobile-ads disabled)
 *
 * This module provides an abstraction layer for AdMob ads.
 *
 * NOTE: Make sure to:
 * 1. Replace placeholder App IDs in app.json with your actual AdMob App IDs
 * 2. Create a development build: npx expo prebuild && npx expo run:android (or run:ios)
 * 3. For production, replace test ad unit IDs with your production ad unit IDs
 */

export interface AdConfig {
  adUnitId: string;
  isRewarded: boolean; // true for rewarded (skipable), false for interstitial (non-skipable)
}

export interface AdResult {
  success: boolean;
  revenue?: number; // Estimated revenue in INR
  error?: string;
}

class AdMobAdManager {
  private isInitialized = false;
  private testAdUnitIds = {
    rewarded: {
      android: "ca-app-pub-3940256099942544/5224354917", // Test rewarded ad unit ID
      ios: "ca-app-pub-3940256099942544/1712485313",
    },
    interstitial: {
      android: "ca-app-pub-3940256099942544/1033173712", // Test interstitial ad unit ID
      ios: "ca-app-pub-3940256099942544/4411468910",
    },
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      try {
        const mobileAdsModule = await import("react-native-google-mobile-ads");
        const mobileAds = mobileAdsModule.default;
        if (mobileAds) {
          await mobileAds().initialize();
          console.log("[AdMob] Initialized successfully");
        }
      } catch (importError) {
        console.warn("[AdMob] SDK not available, using mock mode");
      }

      this.isInitialized = true;
    } catch (error: any) {
      console.warn(
        "[AdMob] Initialization failed, using mock mode:",
        error?.message
      );
      this.isInitialized = true;
    }
  }

  async showRewardedAd(config?: AdConfig): Promise<AdResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      try {
        const mobileAdsModule = await import("react-native-google-mobile-ads");
        const RewardedAd = mobileAdsModule.RewardedAd;
        const RewardedAdEventType = mobileAdsModule.RewardedAdEventType;

        if (!RewardedAd || !RewardedAdEventType) {
          throw new Error(
            "RewardedAd or RewardedAdEventType not exported from react-native-google-mobile-ads"
          );
        }

        const Platform = await import("react-native").then((m) => m.Platform);

        const adUnitId =
          config?.adUnitId ||
          (Platform.OS === "ios"
            ? this.testAdUnitIds.rewarded.ios
            : this.testAdUnitIds.rewarded.android);

        const rewarded = RewardedAd.createForAdRequest(adUnitId, {
          requestNonPersonalizedAdsOnly: true,
        });

        return new Promise((resolve) => {
          let isResolved = false;
          let timeoutId: ReturnType<typeof setTimeout> | null = null;

          const resolveOnce = (result: AdResult) => {
            if (!isResolved) {
              isResolved = true;
              if (timeoutId) clearTimeout(timeoutId);
              resolve(result);
            }
          };

          timeoutId = setTimeout(() => {
            resolveOnce({ success: false, error: "Ad loading timeout" });
          }, 30000);

          rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            if (timeoutId) clearTimeout(timeoutId);
            try {
              rewarded.show();
            } catch (showError: any) {
              resolveOnce({
                success: false,
                error: showError?.message || "Failed to show ad",
              });
            }
          });

          rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            (reward) => {
              const estimatedRevenue = 0.01 + Math.random() * 0.04;
              resolveOnce({ success: true, revenue: estimatedRevenue });
            }
          );

          try {
            rewarded.load();
          } catch (loadError: any) {
            resolveOnce({
              success: false,
              error: loadError?.message || "Failed to load ad",
            });
          }
        });
      } catch (sdkError: any) {
        console.warn(
          "[AdMob] SDK not available, using mock:",
          sdkError?.message
        );
        const mockRevenue = 0.01 + Math.random() * 0.04;
        console.log("[AdMob] Rewarded ad shown (mock), revenue:", mockRevenue);
        return { success: true, revenue: mockRevenue };
      }
    } catch (error: any) {
      console.error("[AdMob] Rewarded ad error:", error);
      return {
        success: false,
        error: error?.message || "Failed to show rewarded ad",
      };
    }
  }

  async showInterstitialAd(config?: AdConfig): Promise<AdResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      try {
        const mobileAdsModule = await import("react-native-google-mobile-ads");
        const InterstitialAd = mobileAdsModule.InterstitialAd;
        const AdEventType = mobileAdsModule.AdEventType;

        if (!InterstitialAd || !AdEventType) {
          throw new Error(
            "InterstitialAd or AdEventType not exported from react-native-google-mobile-ads"
          );
        }

        const Platform = await import("react-native").then((m) => m.Platform);

        const adUnitId =
          config?.adUnitId ||
          (Platform.OS === "ios"
            ? this.testAdUnitIds.interstitial.ios
            : this.testAdUnitIds.interstitial.android);

        const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
          requestNonPersonalizedAdsOnly: true,
        });

        return new Promise((resolve) => {
          let isResolved = false;
          let timeoutId: ReturnType<typeof setTimeout> | null = null;

          const resolveOnce = (result: AdResult) => {
            if (!isResolved) {
              isResolved = true;
              if (timeoutId) clearTimeout(timeoutId);
              resolve(result);
            }
          };

          timeoutId = setTimeout(() => {
            resolveOnce({ success: false, error: "Ad loading timeout" });
          }, 30000);

          interstitial.addAdEventListener(AdEventType.LOADED, () => {
            if (timeoutId) clearTimeout(timeoutId);
            try {
              interstitial.show();
            } catch (showError: any) {
              resolveOnce({
                success: false,
                error: showError?.message || "Failed to show ad",
              });
            }
          });

          interstitial.addAdEventListener(AdEventType.CLOSED, () => {
            const estimatedRevenue = 0.02 + Math.random() * 0.08;
            resolveOnce({ success: true, revenue: estimatedRevenue });
          });

          try {
            interstitial.load();
          } catch (loadError: any) {
            resolveOnce({
              success: false,
              error: loadError?.message || "Failed to load ad",
            });
          }
        });
      } catch (sdkError: any) {
        console.warn(
          "[AdMob] SDK not available, using mock:",
          sdkError?.message
        );
        const mockRevenue = 0.02 + Math.random() * 0.08;
        console.log(
          "[AdMob] Interstitial ad shown (mock), revenue:",
          mockRevenue
        );
        return { success: true, revenue: mockRevenue };
      }
    } catch (error: any) {
      console.error("[AdMob] Interstitial ad error:", error);
      return {
        success: false,
        error: error?.message || "Failed to show interstitial ad",
      };
    }
  }
}

export const adMobAdManager = new AdMobAdManager();

// Stub so imports don't break if re-enabled elsewhere
// export interface AdConfig {
//   adUnitId: string;
//   isRewarded: boolean;
// }
// export interface AdResult {
//   success: boolean;
//   revenue?: number;
//   error?: string;
// }
// export const adMobAdManager = {
//   initialize: async () => {},
//   showRewardedAd: async (_config?: AdConfig): Promise<AdResult> => ({ success: true }),
//   showInterstitialAd: async (_config?: AdConfig): Promise<AdResult> => ({ success: true }),
// };
