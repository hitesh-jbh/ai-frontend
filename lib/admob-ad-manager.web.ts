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
    const mockRevenue = 0.01 + Math.random() * 0.04;
    return { success: true, revenue: mockRevenue };
  }

  async showInterstitialAd(_config?: AdConfig): Promise<AdResult> {
    if (!this.isInitialized) await this.initialize();
    const mockRevenue = 0.02 + Math.random() * 0.08;
    return { success: true, revenue: mockRevenue };
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
