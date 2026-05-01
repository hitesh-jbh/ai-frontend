/**
 * AdMob Ad Manager - Web stub - COMMENTED OUT (Google Mobile Ads / AdMob disabled)
 *
 * On web, AdMob native module is not available. This stub provides the same
 * interface but skips ads and returns mock success so search flow still works.
 */

export interface AdConfig {
  adUnitId: string;
  isRewarded: boolean;
}

export interface AdResult {
  success: boolean;
  revenue?: number;
  error?: string;
}

class AdMobAdManagerWeb {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log("[AdMob] Web: ads disabled (native module not available)");
  }

  async showRewardedAd(_config?: AdConfig): Promise<AdResult> {
    if (!this.isInitialized) await this.initialize();
    // Web does not support the native AdMob SDK. Do not block user flows.
    return { success: true, revenue: 0 };
  }

  async showInterstitialAd(_config?: AdConfig): Promise<AdResult> {
    if (!this.isInitialized) await this.initialize();
    // Web does not support the native AdMob SDK. Do not block user flows.
    return { success: true, revenue: 0 };
  }
}

export const adMobAdManager = new AdMobAdManagerWeb();

// // Stub so imports don't break if re-enabled elsewhere
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
