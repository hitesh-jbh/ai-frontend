import { Dimensions, PixelRatio } from "react-native";

/**
 * Font Scale Utility
 *
 * Scales fonts responsively while respecting the device's font size settings
 * (accessibility font scale preference).
 *
 * Features:
 * 1. Respects device font size settings (accessibility)
 * 2. Responsive scaling based on screen width
 * 3. Works across all device sizes
 *
 * Usage:
 * import { scaleFont } from '@/utils/font-scale';
 *
 * <Text style={{ fontSize: scaleFont(16) }}>Text</Text>
 * <Text style={{ fontSize: scaleFont(24, { min: 18, max: 32 }) }}>Heading</Text>
 */

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const REFERENCE_WIDTH = 375;

// Base scale factor for responsive sizing
const getScaleFactor = (): number => {
  return SCREEN_WIDTH / REFERENCE_WIDTH;
};

// Get device font scale (user's accessibility setting)
const getFontScale = (): number => {
  return PixelRatio.getFontScale();
};

interface ScaleOptions {
  /** Minimum font size (after all scaling) */
  min?: number;
  /** Maximum font size (after all scaling) */
  max?: number;
  /** Whether to apply responsive scaling (default: true) */
  responsive?: boolean;
  /** Whether to respect device font scale (default: true) */
  respectDeviceScale?: boolean;
}

/**
 * Scale font size responsively while respecting device font settings
 *
 * @param size - Base font size (in pixels)
 * @param options - Scaling options
 * @returns Scaled font size (in pixels)
 *
 * @example
 * // Basic usage
 * scaleFont(16) // Scales based on screen and device settings
 *
 * // With min/max constraints
 * scaleFont(24, { min: 18, max: 32 })
 *
 * // Responsive only (ignore device scale)
 * scaleFont(16, { respectDeviceScale: false })
 *
 * // Fixed size (no scaling)
 * scaleFont(16, { responsive: false, respectDeviceScale: false })
 */
export function scaleFont(size: number, options: ScaleOptions = {}): number {
  const { min, max, responsive = true, respectDeviceScale = true } = options;

  let scaledSize = size;

  // Apply responsive scaling based on screen width
  if (responsive) {
    const scaleFactor = getScaleFactor();
    scaledSize = size * scaleFactor;
  }

  // Apply device font scale (accessibility setting)
  if (respectDeviceScale) {
    const fontScale = getFontScale();
    scaledSize = scaledSize * fontScale;
  }

  // Apply min/max constraints
  if (min !== undefined && scaledSize < min) {
    scaledSize = min;
  }
  if (max !== undefined && scaledSize > max) {
    scaledSize = max;
  }

  // Round to nearest pixel
  return Math.round(scaledSize);
}

/**
 * Scale line height based on font size
 * Provides appropriate line height for readability (typically 1.2-1.6x font size)
 *
 * @param fontSize - Font size (typically from scaleFont)
 * @param multiplier - Line height multiplier (default: 1.4 for body text)
 * @returns Scaled line height (in pixels)
 *
 * @example
 * const fontSize = scaleFont(16);
 * const lineHeight = scaleLineHeight(fontSize); // 1.4x multiplier
 * const tightLineHeight = scaleLineHeight(fontSize, 1.2); // 1.2x for headings
 */
export function scaleLineHeight(
  fontSize: number,
  multiplier: number = 1.4
): number {
  // Clamp multiplier between 1.0 and 2.0 for reasonable values
  const clampedMultiplier = Math.max(1.0, Math.min(2.0, multiplier));
  return Math.round(fontSize * clampedMultiplier);
}

/**
 * Get responsive scale factor (0.85 to 1.2 range)
 * Useful for scaling other UI elements alongside fonts
 */
export function getResponsiveScale(): number {
  const scaleFactor = getScaleFactor();
  // Clamp between 0.85 and 1.2 for reasonable scaling
  return Math.max(0.85, Math.min(1.2, scaleFactor));
}

export const LineHeight = {
  xs: () => scaleLineHeight(scaleFont(12), 1.5),
  sm: () => scaleLineHeight(scaleFont(14), 1.5),
  base: () => scaleLineHeight(scaleFont(16), 1.5),
  md: () => scaleLineHeight(scaleFont(18), 1.5),
  lg: () => scaleLineHeight(scaleFont(20), 1.5),
  xl: () => scaleLineHeight(scaleFont(22), 1.5),
  "2xl": () => scaleLineHeight(scaleFont(24), 1.7),
  "3xl": () => scaleLineHeight(scaleFont(28), 1.7),
  "4xl": () => scaleLineHeight(scaleFont(32), 1.7),
  "5xl": () => scaleLineHeight(scaleFont(36), 1.7),
};

/**
 * Preset font sizes with proper scaling
 * These are commonly used sizes that work well across devices
 */
export const FontSizes = {
  // Extra small (captions, timestamps)
  xs: (options?: ScaleOptions) => scaleFont(12, options),
  // Small (labels, secondary text)
  sm: (options?: ScaleOptions) => scaleFont(14, options),
  // Base (body text)
  base: (options?: ScaleOptions) => scaleFont(16, options),
  // Medium (emphasized body)
  md: (options?: ScaleOptions) => scaleFont(18, options),
  // Large (subheadings)
  lg: (options?: ScaleOptions) => scaleFont(20, options),
  // Extra large (headings)
  xl: (options?: ScaleOptions) => scaleFont(22, options),
  // 2X large (page titles)
  "2xl": (options?: ScaleOptions) => scaleFont(24, options),
  // 3X large (hero titles)
  "3xl": (options?: ScaleOptions) => scaleFont(28, options),
  // 4X large (display text)
  "4xl": (options?: ScaleOptions) => scaleFont(32, options),
  // 5X large (large display)
  "5xl": (options?: ScaleOptions) => scaleFont(36, options),
};

/**
 * Hook-style function to get current font scale
 * Useful when you need the scale value in components
 */
export function getCurrentFontScale(): number {
  return getFontScale();
}

/**
 * Check if user has increased font size
 */
export function isFontScaleIncreased(): boolean {
  return getFontScale() > 1.0;
}

/**
 * Check if user has decreased font size
 */
export function isFontScaleDecreased(): boolean {
  return getFontScale() < 1.0;
}

/**
 * Get font size and line height together
 * Convenience function to get both values at once
 *
 * @param size - Base font size
 * @param options - Scaling options
 * @param lineHeightMultiplier - Line height multiplier (default: 1.4)
 * @returns Object with fontSize and lineHeight
 */
export function getFontSizeAndLineHeight(size: keyof typeof FontSizes): {
  fontSize: number;
  lineHeight: number;
} {
  return { fontSize: FontSizes[size](), lineHeight: LineHeight[size]() };
}
