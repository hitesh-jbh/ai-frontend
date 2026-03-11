/**
 * Responsive Text Utility System for NativeWind
 *
 * This utility provides consistent responsive text sizing across the app.
 * Text sizes scale appropriately based on screen width:
 *
 * Breakpoints:
 * - Base (< 375px): Small phones
 * - sm (>= 375px): Medium phones (iPhone SE, standard phones)
 * - md (>= 414px): Large phones (iPhone Pro Max, Android flagships)
 * - lg (>= 768px): Tablets (iPad)
 * - xl (>= 1024px): Large tablets (iPad Pro)
 *
 * Usage:
 * import { getResponsiveTextClass } from '@/utils/responsive-text';
 *
 * <Text className={getResponsiveTextClass('heading')}>Title</Text>
 * <Text className={getResponsiveTextClass('body')}>Body text</Text>
 */

export type TextSize =
  | "xs" // Extra small (captions, labels)
  | "sm" // Small (secondary text, metadata)
  | "base" // Base (body text, default)
  | "lg" // Large (subheadings, emphasized text)
  | "xl" // Extra large (section headings)
  | "2xl" // 2X large (page titles)
  | "3xl" // 3X large (hero titles)
  | "4xl"; // 4X large (display text)

export type TextVariant =
  | "caption" // xs - For captions, timestamps, small labels
  | "label" // sm - For form labels, secondary info
  | "body" // base - Default body text
  | "bodyLarge" // lg - Emphasized body text
  | "subheading" // xl - Section subheadings
  | "heading" // 2xl - Page headings
  | "title" // 3xl - Large titles
  | "display"; // 4xl - Hero/display text

/**
 * Get responsive text class for a specific variant
 * Automatically scales based on screen size
 */
export function getResponsiveTextClass(variant: TextVariant): string {
  const classes: Record<TextVariant, string> = {
    caption: "text-xs sm:text-xs md:text-sm",
    label: "text-sm sm:text-sm md:text-base",
    body: "text-base sm:text-base md:text-lg",
    bodyLarge: "text-lg sm:text-lg md:text-xl",
    subheading: "text-xl sm:text-xl md:text-2xl",
    heading: "text-2xl sm:text-2xl md:text-3xl lg:text-4xl",
    title: "text-3xl sm:text-3xl md:text-4xl lg:text-5xl",
    display: "text-4xl sm:text-4xl md:text-5xl lg:text-6xl",
  };

  return classes[variant];
}

/**
 * Get responsive text class for a specific size
 * Use this for custom sizing needs
 */
export function getResponsiveTextSize(size: TextSize): string {
  const classes: Record<TextSize, string> = {
    xs: "text-xs sm:text-xs md:text-sm",
    sm: "text-sm sm:text-sm md:text-base",
    base: "text-base sm:text-base md:text-lg",
    lg: "text-lg sm:text-lg md:text-xl",
    xl: "text-xl sm:text-xl md:text-2xl",
    "2xl": "text-2xl sm:text-2xl md:text-3xl lg:text-4xl",
    "3xl": "text-3xl sm:text-3xl md:text-4xl lg:text-5xl",
    "4xl": "text-4xl sm:text-4xl md:text-5xl lg:text-6xl",
  };

  return classes[size];
}

/**
 * Responsive text class combinations for common use cases
 */
export const ResponsiveText = {
  // Captions and small text
  caption: "text-xs sm:text-xs md:text-sm",
  label: "text-sm sm:text-sm md:text-base",

  // Body text
  body: "text-base sm:text-base md:text-lg",
  bodyLarge: "text-lg sm:text-lg md:text-xl",

  // Headings
  subheading: "text-xl sm:text-xl md:text-2xl",
  heading: "text-2xl sm:text-2xl md:text-3xl lg:text-4xl",
  title: "text-3xl sm:text-3xl md:text-4xl lg:text-5xl",
  display: "text-4xl sm:text-4xl md:text-5xl lg:text-6xl",

  // Button text
  button: "text-base sm:text-base md:text-lg",
  buttonSmall: "text-sm sm:text-sm md:text-base",

  // Navigation
  nav: "text-base sm:text-base md:text-lg",
  navSmall: "text-sm sm:text-sm md:text-base",
};
