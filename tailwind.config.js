/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "outfit-extra-light": "Outfit-ExtraLight",
        "outfit-light": "Outfit-Light",
        "outfit-regular": "Outfit-Regular",
        "outfit-medium": "Outfit-Medium",
        "outfit-semi-bold": "Outfit-SemiBold",
        "outfit-bold": "Outfit-Bold",
        "outfit-extra-bold": "Outfit-ExtraBold",
      },
      screens: {
        // Mobile-first responsive breakpoints
        // Base: < 375px (small phones)
        // sm: >= 375px (medium phones like iPhone SE, standard phones)
        // md: >= 414px (large phones like iPhone Pro Max, Android flagships)
        // lg: >= 768px (tablets, iPad)
        // xl: >= 1024px (large tablets, iPad Pro)
        sm: "375px",
        md: "414px",
        lg: "768px",
        xl: "1024px",
      },
    },
  },
  plugins: [],
};
