import { AxiosInstance } from "axios";
import {
  AddonCreateOrderResponse,
  ApiResponse,
  createAddonService,
} from "./addon.service";

export type SpaceExtensionType = "per_gb" | "yearly";

export interface SpaceExtensionUsage {
  storageRemainingGb: number;
}

export interface SpaceExtensionPack {
  id: string;
  packType: "space_extension";
  storageGb: number;
  storageUsedGb: number;
  expiresAt: string;
  createdAt: string;
}

export const createSpaceExtensionService = (axiosInstance: AxiosInstance) => {
  const addon = createAddonService(axiosInstance);

  return {
    /**
     * Get Space Extension remaining storage (GB) from /addons/usage
     */
    async getUsage(): Promise<SpaceExtensionUsage> {
      const usage = await addon.getUsage();
      return usage.spaceExtension;
    },

    /**
     * Create Razorpay order for Space Extension: ₹99/1 GB or ₹499/15 GB per year
     */
    async createOrder(type: SpaceExtensionType): Promise<AddonCreateOrderResponse> {
      const product =
        type === "yearly" ? "space_extension_yearly" : "space_extension_per_gb";
      return addon.createOrder({ product });
    },

    /**
     * Verify payment and activate Space Extension (backend infers product from order)
     */
    async verifyPayment(data: {
      type: SpaceExtensionType;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }): Promise<SpaceExtensionPack> {
      const response = await axiosInstance.post<ApiResponse<SpaceExtensionPack>>(
        "/addons/verify-payment",
        {
          razorpayOrderId: data.razorpayOrderId,
          razorpayPaymentId: data.razorpayPaymentId,
          razorpaySignature: data.razorpaySignature,
        }
      );
      return response.data.data as SpaceExtensionPack;
    },
  };
};
