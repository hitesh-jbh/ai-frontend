/**
 * Text Style Utilities
 * 
 * Convenience functions for common text styles with scaled fonts and line heights
 * Use these instead of className text size utilities to respect device font settings
 */

import { scaleFont, scaleLineHeight } from "./font-scale";

/**
 * Get style object for common text sizes with appropriate line heights
 */
export const TextStyles = {
  xs: () => {
    const fontSize = scaleFont(10);
    return { fontSize, lineHeight: scaleLineHeight(fontSize, 1.5) };
  },
  sm: () => {
    const fontSize = scaleFont(12);
    return { fontSize, lineHeight: scaleLineHeight(fontSize, 1.4) };
  },
  base: () => {
    const fontSize = scaleFont(14);
    return { fontSize, lineHeight: scaleLineHeight(fontSize, 1.4) };
  },
  md: () => {
    const fontSize = scaleFont(16);
    return { fontSize, lineHeight: scaleLineHeight(fontSize, 1.4) };
  },
  lg: () => {
    const fontSize = scaleFont(18);
    return { fontSize, lineHeight: scaleLineHeight(fontSize, 1.3) };
  },
  xl: () => {
    const fontSize = scaleFont(20);
    return { fontSize, lineHeight: scaleLineHeight(fontSize, 1.2) };
  },
  "2xl": () => {
    const fontSize = scaleFont(24);
    return { fontSize, lineHeight: scaleLineHeight(fontSize, 1.2) };
  },
  "3xl": () => {
    const fontSize = scaleFont(30);
    return { fontSize, lineHeight: scaleLineHeight(fontSize, 1.2) };
  },
  "4xl": () => {
    const fontSize = scaleFont(36);
    return { fontSize, lineHeight: scaleLineHeight(fontSize, 1.2) };
  },
};

